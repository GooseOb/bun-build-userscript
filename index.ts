import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BuildConfig } from "bun";
import { print } from "./print";

export class UserScriptConfig {
  /*
   * Do add a try catch block to the script to log errors to the console
   */
  logErrors: boolean = false;
  /*
   * Do clear the terminal after building in watch mode
   */
  clearTerminal: boolean = false;
  /*
   * Path to the header file
   *
   * If assigned beyond the constructor, should be an absolute path
   *
   * @default ./header.txt
   */
  header: string = resolve("header.txt");
  /*
   * Path to the entry file or directory (if passed a directory, index.ts is used, but all files are watched in watch mode)
   *
   * If assigned beyond the constructor, should be an absolute path
   *
   * @default ./index.ts
   */
  entry: string = resolve("index.ts");
  /*
   * Transform the code after building
   */
  transform?: (code: string) => string;
  /*
   * Execute before building
   */
  before?: (cfgs: CompleteBuildConfigs) => void | Promise<void>;

  constructor(config?: Partial<UserScriptConfig>) {
    if (config) {
      if (config.header) this.header = resolve(config.header);
      if (config.entry)
        this.entry = config.entry.endsWith(".ts")
          ? resolve(config.entry)
          : resolve(config.entry, "index.ts");
      if (config.transform) this.transform = config.transform;
      if (config.logErrors) this.logErrors = config.logErrors;
      if (config.clearTerminal) this.clearTerminal = config.clearTerminal;
      if (config.before) this.before = config.before;
    }
  }
}

const postprocess = (code: string) =>
  `\n(function(){${code.replace(/(?:\\u[A-Fa-f\d]{4})+/g, ($0) =>
    JSON.parse(`"${$0}"`),
  )}})()`;

const addErrorLogging = (code: string) =>
  `try{${code}}catch(e){console.error("%c   Userscript Error   \\n","color:red;font-weight:bold;background:white",e)}`;

type CompleteBuildConfigs = {
  bun: BuildConfig;
  userscript: UserScriptConfig;
};

export type BuildConfigs = {
  [P in keyof CompleteBuildConfigs]?: Partial<CompleteBuildConfigs[P]>;
};

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
