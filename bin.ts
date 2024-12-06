#!/usr/bin/env bun

import { watch } from "node:fs/promises";
import { type BuildUserscriptConfig, build, print } from "./index.ts";
import * as path from "path";

const firstArg = process.argv[2];
if (firstArg === "--version" || firstArg === "-v") {
  print((await import(path.join(import.meta.dir, "package.json"))).version);
  process.exit(0);
}

const getOptionContent = (name: string, what: string) => {
  const index = process.argv.indexOf(name) + 1;
  if (index === process.argv.length) {
    print("please, specify the " + what);
    process.exit(1);
  }
  return index && process.argv[index];
};

const outputOption = getOptionContent("--out", "output path");
const configOption = getOptionContent("--cfg", "config path");

const isBuild = !process.argv.includes("--watch");

const userConfig =
  configOption &&
  (await import(path.resolve(process.cwd(), configOption))).default;

const config = {
  naming: "script.user.js",
  ...userConfig,
  userscript: {
    logErrors: process.argv.includes("--log-errors"),
    clearTerminal: !(isBuild || process.argv.includes("--no-clear")),
    ...userConfig?.userscript,
  },
} satisfies BuildUserscriptConfig;
if (outputOption) config.naming = outputOption;

await build(config);

if (isBuild) process.exit(0);

for await (const event of watch(".")) {
  const { filename } = event;
  if (filename === "index.ts" || filename === "header.txt") await build(config);
}
