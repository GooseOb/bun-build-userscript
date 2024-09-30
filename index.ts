import { readFile } from "node:fs/promises";
import * as path from "node:path";
import type { BuildConfig } from "bun";

export interface BuildUserscriptConfig extends BuildConfig {
  userscript?: {
    logErrors?: boolean;
  };
}

export const print = (msg: string) => {
  process.stdout.write(`\x1b[35m[bun-build-userscript]\x1b[0m ${msg}\n`);
};

const postprocess = (code: string) =>
  `\n(function(){${code.replace(/(?:\\u[A-Fa-f\d]{4})+/g, ($0) =>
    JSON.parse(`"${$0}"`),
  )}})()`;
const addErrorLogging = (code: string) =>
  `try{${code}}catch(e){console.error("%c   Userscript Error   \\n","color:red;font-weight:bold;background:white",e)}`;

export const build = async (config: BuildUserscriptConfig) => {
  const startTime = performance.now();

  const output = await Bun.build({
    // @ts-expect-error
    entrypoints: ["index.ts"],
    outdir: ".",
    ...config,
  });

  if (!output.success) {
    print("error");
    process.exit(1);
  }

  const outPath = output.outputs[0].path;

  let result = postprocess(await readFile(outPath, "utf-8"));
  if (config.userscript?.logErrors) {
    result = addErrorLogging(result);
  }

  let header = await readFile("header.txt", "utf-8");
  if (header.includes("{version}")) {
    const { version } = await import(path.resolve("package.json"));
    header = header.replace(/{version}/g, version);
  }

  await Bun.write(outPath, header + result);
  print(`done in ${performance.now() - startTime} ms`);
};
