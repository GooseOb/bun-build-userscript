#!/usr/bin/env bun

import { watch } from "node:fs/promises";
import { type BuildUserscriptConfig, build, print } from "./index.ts";
import * as path from "path";

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

const config = {
  userscript: {
    logErrors: process.argv.includes("--log-errors"),
  },
  naming: "dist.js",
  ...(configOption &&
    (await import(path.resolve(process.cwd(), configOption))).default),
  ...(outputOption && { naming: outputOption }),
} satisfies BuildUserscriptConfig;
if (outputOption) config.naming = outputOption;

await build(config);

if (process.argv.includes("--build")) process.exit(0);

for await (const event of watch(".")) {
  const { filename } = event;
  if (filename === "index.ts" || filename === "header.txt") await build(config);
}
