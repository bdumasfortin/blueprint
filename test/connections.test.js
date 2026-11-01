import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SessionStore } from "../src/session-store.js";
import { bindReview, reviewGuard, interruptReview, assertReviewOwner, claimWaiter, processIsAlive, codexTaskId } from "../src/connections.js";

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-connection-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const artifact = path.join(root, "review.html");
  await writeFile(artifact, "<!doctype html><h1>Review</h1>");
  const store = new SessionStore(root);
  const opened = await store.openArtifact(artifact);
  const options = { stateDir: root };
  await bindReview(options, { taskId: "task-a", sessionId: opened.sessionId, artifactPath: artifact });
  return {root, artifact, store, opened, options};
}

test("the guard follows task ownership, keeps staged work active, and bounds failed continuation", async t => {
  const {store, opened, options, artifact} = await fixture(t);
  assert.deepEqual(await reviewGuard({session_id:"task-b"},options), {});
  assert.equal((await reviewGuard({session_id:"task-a"},options)).decision,"block");
  await store.stageArtifact(artifact);
  assert.equal((await reviewGuard({session_id:"task-a",stop_hook_active:true},options)).decision,"block");
  assert.equal((await reviewGuard({session_id:"task-a",stop_hook_active:true},options)).decision,"block");
  assert.equal((await reviewGuard({session_id:"task-a",stop_hook_active:true},options)).decision,"block");
  const exhausted = await reviewGuard({session_id:"task-a",stop_hook_active:true},options);
  assert.equal(exhausted.decision,undefined);
  assert.match(exhausted.systemMessage,/recovery.*exhausted/i);
  await assert.rejects(bindReview(options,{taskId:"task-b",sessionId:opened.sessionId,artifactPath:artifact}), /another Codex task/);
  await assert.rejects(assertReviewOwner(options,opened.sessionId,"task-b"), /another Codex task/);
});

test("waiter ownership survives quiet polls and recovers only a dead owner", () => {
  const waiters=new Map();const first={id:"first",pid:12};
  claimWaiter(waiters,"review",first,()=>true);
  claimWaiter(waiters,"review",first,()=>true);
  assert.throws(()=>claimWaiter(waiters,"review",{id:"other",pid:13},()=>true),/live feedback wait/);
  claimWaiter(waiters,"review",{id:"other",pid:13},()=>false);
  assert.equal(waiters.get("review").id,"other");
  assert.equal(processIsAlive(process.pid),true);
  assert.equal(processIsAlive(-1),false);
  assert.equal(processIsAlive(2_000_000_000),false);
  assert.equal(codexTaskId({CODEX_SESSION_ID:"session"}),"session");
  assert.equal(codexTaskId({}),null);
});

test("missing ownership is quiet and corrupted owned state reports a recovery blocker", async t => {
  const {root,opened,options}=await fixture(t);
  assert.deepEqual(await reviewGuard({},options),{});
  assert.deepEqual(await interruptReview({},options),{});
  await bindReview(options,{taskId:null});
  await assertReviewOwner(options,opened.sessionId,null);
  assert.deepEqual(await reviewGuard({session_id:"unknown"},{stateDir:path.join(root,"absent")}),{});
  await writeFile(path.join(root,"sessions",opened.sessionId,"manifest.json"),"invalid");
  assert.match((await reviewGuard({session_id:"task-a"},options)).systemMessage,/could not verify/);
  assert.match((await reviewGuard({session_id:"../bad"},options)).systemMessage,/identifier/);
});

test("approval must be delivered; explicit End review and interruption release the guard", async t => {
  const {store,opened,options,artifact} = await fixture(t);
  await interruptReview({session_id:"task-a"},options);
  assert.deepEqual(await reviewGuard({session_id:"task-a"},options),{});
  await bindReview(options,{taskId:"task-a",sessionId:opened.sessionId,artifactPath:artifact});
  assert.equal((await reviewGuard({session_id:"task-a"},options)).decision,"block");
  const packet = await store.sendPacket(opened.reviewToken,{intent:"approve"});
  assert.equal((await reviewGuard({session_id:"task-a"},options)).decision,"block");
  await store.acknowledgePacket(opened.sessionId,packet.id);
  assert.deepEqual(await reviewGuard({session_id:"task-a"},options),{});
  const next = await store.openArtifact(artifact);
  await bindReview(options,{taskId:"task-a",sessionId:next.sessionId,artifactPath:artifact});
  await store.endSession(next.reviewToken);
  assert.deepEqual(await reviewGuard({session_id:"task-a"},options),{});
});
