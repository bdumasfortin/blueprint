import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";

async function syncDirectory(directory) {
  let handle;
  try {
    handle = await open(directory, "r");
    await handle.sync();
  } catch (error) {
    if (!["EISDIR", "EINVAL", "ENOTSUP", "EPERM", "EACCES"].includes(error?.code)) {
      throw error;
    }
  } finally {
    await handle?.close();
  }
}

export async function atomicWriteFile(target, contents, options = {}) {
  const directory = path.dirname(target);
  await mkdir(directory, { recursive: true });
  const temporary = path.join(
    directory,
    `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporary, "wx", options.mode ?? 0o600);
    await handle.writeFile(contents);
    await handle.sync();
    await handle.close();
    handle = null;
    await options.beforeRename?.(temporary, target);
    await rename(temporary, target);
    await syncDirectory(directory);
  } catch (error) {
    await handle?.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function atomicWriteJson(target, value, options = {}) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  await atomicWriteFile(target, serialized, options);
}

export async function writeImmutableFile(target, contents, options = {}) {
  await mkdir(path.dirname(target), { recursive: true });
  const handle = await open(target, "wx", options.mode ?? 0o600);
  try {
    await handle.writeFile(contents);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(path.dirname(target));
}

export async function readJson(target) {
  return JSON.parse(await readFile(target, "utf8"));
}
