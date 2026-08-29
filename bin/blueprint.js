#!/usr/bin/env node

import { formatCliError, runCli } from "../src/cli.js";

try {
  await runCli();
} catch (error) {
  process.stdout.write(formatCliError(error));
  process.exitCode = Number.isInteger(error?.exitCode) ? error.exitCode : 1;
}
