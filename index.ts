import { readFile } from "node:fs/promises";
import * as path from "node:path";
import type { BuildConfig } from "bun";

export interface BuildUserscriptConfig extends BuildConfig {
  userscript?: {
    logErrors?: boolean;
    clearTerminal?: boolean;
    transform?: (code: string) => string;
  };
}

export const print = (msg: string, writer = process.stdout) => {
  writer.write(`\x1b[35m[bun-build-userscript]\x1b[0m ${msg}\n`);
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
    print("error\n" + output.logs, process.stderr);
    process.exit(1);
  }

  const outPath = output.outputs[0].path;

  let result = postprocess(await readFile(outPath, "utf-8"));
  const uscfg = config.userscript || {};
  if (uscfg.transform) {
    result = uscfg.transform(result);
  }
  if (uscfg.logErrors) {
    result = addErrorLogging(result);
  }

  let header = await readFile("header.txt", "utf-8");
  if (header.includes("{version}")) {
    const { version } = await import(path.resolve("package.json"));
    header = header.replace(/{version}/g, version);
  }

  await Bun.write(outPath, header + result);
  if (uscfg.clearTerminal) {
    process.stdout.write("\x1b[2J\x1b[0;0H");
  }
  print(`done in ${performance.now() - startTime} ms`);
};
