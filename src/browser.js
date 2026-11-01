import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { atomicWriteJson, readJson } from "./atomic.js";
import { CliError } from "./axi.js";

function browserName(value) {
  if (!["chrome", "default"].includes(value)) throw new CliError("UNKNOWN_BROWSER", "Browser must be chrome or default.", {exitCode: 2});
  return value;
}
export async function browserPreference(stateDir, selected, env = process.env) {
  if (selected) return browserName(selected);
  if (env.BLUEPRINT_BROWSER) return browserName(env.BLUEPRINT_BROWSER);
  try { return browserName((await readJson(path.join(stateDir,"preferences.json"))).browser ?? "default"); }
  catch (error) { if (error.code === "ENOENT") return "default"; throw error; }
}
export async function setBrowserPreference(stateDir, value) {
  const file = path.join(stateDir,"preferences.json");
  let settings = {};
  try { settings = await readJson(file); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw new CliError("INVALID_PREFERENCES", "Blueprint preferences must be an object.");
  await atomicWriteJson(file, {...settings, browser: browserName(value)});
}

export async function browserCommand(url, browser, options = {}) {
  browserName(browser);
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  if (browser === "default") {
    if (platform === "win32") return ["rundll32", ["url.dll,FileProtocolHandler", url]];
    if (platform === "darwin") return ["open", [url]];
    return ["xdg-open", [url]];
  }
  if (platform === "darwin") return ["open", ["-a", "Google Chrome", url]];
  if (platform !== "win32") return ["google-chrome", [url]];
  const candidates = [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA]
    .filter(Boolean).map(root => path.join(root, "Google", "Chrome", "Application", "chrome.exe"));
  const exists = options.exists ?? (async file => { try { await access(file); return true; } catch { return false; } });
  for (const candidate of candidates) if (await exists(candidate)) return [candidate, [url]];
  throw new CliError("CHROME_NOT_FOUND", "Chrome was not found in the standard installation locations. Open the review URL in Chrome, or explicitly select --browser default.");
}

export async function launchBrowser(url, browser, options = {}) {
  const [command, args] = await browserCommand(url, browser, options);
  const start = options.spawn ?? spawn;
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = start(command, args, { detached: true, stdio: "ignore", windowsHide: true, shell: false });
    const finish = (error) => {
      if (settled) return;
      settled = true; clearTimeout(timer); child.unref();
      if (error) reject(error); else resolve({browser, status:"launch-request-accepted"});
    };
    const timer = setTimeout(() => finish(), options.startupMs ?? 750);
    child.once("error", error => finish(new CliError("BROWSER_LAUNCH_FAILED", `Browser launch failed: ${error.code ?? error.message}`)));
    child.once("exit", (code, signal) => finish(code === 0 ? null : new CliError("BROWSER_LAUNCH_FAILED", `Browser launcher exited ${code ?? signal}.`)));
  });
}
