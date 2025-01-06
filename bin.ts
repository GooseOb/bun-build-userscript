#!/usr/bin/env bun

import { watch } from "node:fs/promises";
import { join, resolve } from "path";
import { type BuildConfigs, UserScriptConfig, build } from "./index.ts";
import { print } from "./print.ts";

const firstArg = process.argv[2];
if (firstArg === "--version" || firstArg === "-v") {
  print((await import(join(import.meta.dir, "package.json"))).version);
  process.exit(0);
}

const getArg = (name: string, what: string) => {
  const index = process.argv.indexOf(name) + 1;
  if (index === process.argv.length) {
    print(`Missing [${what}] after ${name}`, process.stderr);
    process.exit(1);
  }
  return index ? process.argv[index] : undefined;
};
const getPathArg = (name: string, what: string) => {
  const path = getArg(name, what + " path");
  return path && resolve(path);
};

const configPath = getPathArg("--cfg", "config");

const cfg = Object.assign(
  {},
  configPath && (await import(configPath)),
) as BuildConfigs;

const isBuild = !process.argv.includes("--watch");

cfg.userscript = {
  logErrors: process.argv.includes("--log-errors"),
  clearTerminal: !(isBuild || process.argv.includes("--no-clear")),
  header: getPathArg("--header", "header"),
  entry: getPathArg("--entry", "entrypoint"),
  ...cfg.userscript,
};

let srcPath = cfg.userscript.entry!;
cfg.userscript = new UserScriptConfig(cfg.userscript);
srcPath = srcPath ? resolve(srcPath) : cfg.userscript.entry!;
const { header: headerPath } = cfg.userscript;

const outputPath = getPathArg("--out", "output");
if (outputPath) {
  cfg.bun ||= {} as BuildConfigs["bun"];
  cfg.bun!.naming = outputPath;
}

await build(cfg);

if (isBuild) process.exit(0);

const delay = +getArg("--delay", "delay between change and build")! || 100;

for await (const event of watch(".", { recursive: true })) {
  if (!event.filename) continue;
  const path = resolve(event.filename);
  if (path.startsWith(srcPath) || path === headerPath) {
    setTimeout(() => {
      build(cfg).catch(console.error);
    }, delay);
  }
}
