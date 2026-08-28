#!/usr/bin/env node

import { runCli } from "../src/cli.js";

try {
  await runCli();
} catch (error) {
  process.stderr.write(`Blueprint: ${error.message}\n`);
  process.exitCode = 1;
}
