import { createHash } from "node:crypto";
import { stat, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function getStateRoot(environment = process.env) {
  if (environment.BLUEPRINT_STATE_DIR) {
    return path.resolve(environment.BLUEPRINT_STATE_DIR);
  }
  if (process.platform === "win32" && environment.LOCALAPPDATA) {
    return path.join(environment.LOCALAPPDATA, "Blueprint");
  }
  if (environment.XDG_STATE_HOME) {
    return path.join(environment.XDG_STATE_HOME, "blueprint");
  }
  return path.join(os.homedir(), ".local", "state", "blueprint");
}

export async function canonicalArtifactPath(inputPath) {
  const requested = path.resolve(String(inputPath || ""));
  if (path.extname(requested).toLowerCase() !== ".html") {
    throw new Error("Blueprint currently accepts only .html artifacts.");
  }

  let canonical;
  try {
    canonical = await realpath(requested);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Artifact does not exist: ${requested}`);
    }
    throw error;
  }

  const details = await stat(canonical);
  if (!details.isFile()) {
    throw new Error(`Artifact is not a file: ${canonical}`);
  }
  return canonical;
}

export function pathKeyFor(canonicalPath) {
  const normalized = process.platform === "win32"
    ? canonicalPath.toLowerCase()
    : canonicalPath;
  return createHash("sha256").update(normalized).digest("hex");
}

export function resolveInside(root, ...segments) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, candidate);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
    return candidate;
  }
  throw new Error(`Resolved path is outside the declared state root: ${candidate}`);
}
