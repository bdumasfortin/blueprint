import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { browserCommand, browserPreference, setBrowserPreference, launchBrowser } from "../src/browser.js";

test("browser selection preserves exact URL arguments and keeps preference explicit", async t => {
  const root = await mkdtemp(path.join(tmpdir(), "blueprint-browser-"));
  t.after(() => rm(root, {recursive:true,force:true}));
  assert.equal(await browserPreference(root,null,{}),"default");
  await setBrowserPreference(root,"chrome");
  assert.equal(await browserPreference(root,null,{}),"chrome");
  assert.equal(await browserPreference(root,"default",{BLUEPRINT_BROWSER:"chrome"}),"default");
  assert.equal(await browserPreference(root,null,{BLUEPRINT_BROWSER:"default"}),"default");
  await assert.rejects(setBrowserPreference(root,"unknown"),/chrome or default/);
  const url = 'http://127.0.0.1:1234/review/token?x=a&y=";$(touch nope)';
  for (const [platform,expected] of [["win32","rundll32"],["darwin","open"],["linux","xdg-open"]]) {
    const [command,args] = await browserCommand(url,"default",{platform});
    assert.equal(command,expected); assert.equal(args.at(-1),url);
  }
  assert.deepEqual(await browserCommand(url,"chrome",{platform:"darwin"}),["open",["-a","Google Chrome",url]]);
  assert.deepEqual(await browserCommand(url,"chrome",{platform:"linux"}),["google-chrome",[url]]);
  const selected = await browserCommand(url,"chrome",{platform:"win32",env:{PROGRAMFILES:"primary",LOCALAPPDATA:"user"},exists:async file=>file.startsWith("user")});
  assert.equal(selected[1][0],url);assert.match(selected[0],/user/);
  await assert.rejects(browserCommand(url,"chrome",{platform:"win32",env:{},exists:async()=>false}),/Chrome was not found/);
  await writeFile(path.join(root,"preferences.json"),'[]');
  await assert.rejects(setBrowserPreference(root,"chrome"),/must be an object/);
  await writeFile(path.join(root,"preferences.json"),'{bad');
  await assert.rejects(browserPreference(root,null,{}));
});

test("browser startup reports failed launches without claiming a visible tab", async () => {
  function starter(event,value) {
    return (_command,args,options) => {
      assert.equal(options.shell,false); assert.equal(args.at(-1),"http://127.0.0.1/review/test");
      const child = new EventEmitter(); child.unref=()=>{};
      if (event) queueMicrotask(()=>child.emit(event,value));
      return child;
    };
  }
  const options={platform:"linux",startupMs:1};
  await assert.rejects(launchBrowser("http://127.0.0.1/review/test","default",{...options,spawn:starter("error",{code:"ENOENT"})}),/ENOENT/);
  await assert.rejects(launchBrowser("http://127.0.0.1/review/test","default",{...options,spawn:starter("exit",1)}),/exited 1/);
  const success=await launchBrowser("http://127.0.0.1/review/test","default",{...options,spawn:starter("exit",0)});
  assert.equal(success.status,"launch-request-accepted");
  assert.equal((await launchBrowser("http://127.0.0.1/review/test","default",{...options,spawn:starter()})).status,success.status);
});
