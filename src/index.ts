import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { print } from "./print";
import { type BuildConfigs, UserScriptConfig } from "./config";
export type { BuildConfigs } from "./config";

const postprocess = (code: string) =>
  `\n(function(){${code.replace(/(?:\\u[A-Fa-f\d]{4})+/g, ($0) =>
    JSON.parse(`"${$0}"`),
  )}})()`;

const addErrorLogging = (code: string) =>
  `try{${code}}catch(e){console.error("%c   Userscript Error   \\n","color:red;font-weight:bold;background:white",e)}`;

export const build = async ({
  bun: bunConfig,
  userscript: userscriptConfig,
}: BuildConfigs) => {
  const startTime = performance.now();

  const userscript: UserScriptConfig =
    userscriptConfig instanceof UserScriptConfig
      ? userscriptConfig
      : new UserScriptConfig(userscriptConfig);

  const bun = {
    entrypoints: [userscript.entry],
    naming: "script.user.js",
    outdir: ".",
    ...bunConfig,
  };

  await userscript.before?.({ bun, userscript });

  const output = await Bun.build(bun);

  if (!output.success) {
    print("error\n" + output.logs, process.stderr);
    process.exit(1);
  }

  const outPath = output.outputs[0].path;

  let result = postprocess(await readFile(outPath, "utf-8"));
  if (userscript.transform) {
    result = userscript.transform(result);
  }
  if (userscript.logErrors) {
    result = addErrorLogging(result);
  }

  let header = await readFile(userscript.header, "utf-8");
  if (header.includes("{version}")) {
    const { version } = await import(resolve("package.json"));
    header = header.replace(/{version}/g, version);
  }

  await Bun.write(outPath, header + result);
  if (userscript.clearTerminal) {
    process.stdout.write("\x1b[2J\x1b[0;0H");
  }
  print(`done in ${performance.now() - startTime} ms`);
};
