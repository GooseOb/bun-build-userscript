#!/usr/bin/env bun

import { watch } from "node:fs/promises";
import { join, resolve } from "path";
import { type BuildConfigs, UserScriptConfig } from "./config.ts";
import { build } from "./index.ts";
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
  {
    bun: {},
    userscript: {},
  },
  configPath && (await import(configPath)),
) as Required<BuildConfigs>;

const isBuild = !process.argv.includes("--watch");

if (process.argv.includes("--log-errors")) cfg.userscript.logErrors = true;

if (isBuild || process.argv.includes("--no-clear"))
  cfg.userscript.clearTerminal = false;

let headerPath = getPathArg("--header", "header");
if (headerPath) cfg.userscript.header = headerPath;

let entryPath = getPathArg("--entry", "entrypoint");
if (entryPath) {
  cfg.userscript.entry = entryPath;
} else if (cfg.userscript.entry) {
  entryPath = resolve(cfg.userscript.entry);
}

cfg.userscript = new UserScriptConfig(cfg.userscript);

const outputPath = getPathArg("--out", "output");
if (outputPath) cfg.bun.naming = outputPath;

await build(cfg);

if (isBuild) process.exit(0);

entryPath ||= cfg.userscript.entry!;
headerPath ||= cfg.userscript.header!;

const delay = +getArg("--delay", "delay between change and build")! || 100;

print(`Watching for changes in ${entryPath} and ${headerPath}`);

let isBuilding = false;
for await (const event of watch(".", { recursive: true })) {
  if (isBuilding || !event.filename) continue;
  const path = resolve(event.filename);
  if (path.startsWith(entryPath!) || path === headerPath) {
    isBuilding = true;
    setTimeout(() => {
      isBuilding = false;
      build(cfg).catch(console.error);
    }, delay);
  }
}
