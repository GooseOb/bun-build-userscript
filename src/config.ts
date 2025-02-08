import { resolve } from "path";
import type { BuildConfig } from "bun";
import { existsSync } from "fs";

const findFile = (name: string) => {
  for (const dir of [".", "src"]) {
    let path = resolve(dir, name);
    if (existsSync(path)) return path;
  }
  throw new Error(`Could not find ${name}`);
};

type CompleteBuildConfigs = {
  bun: BuildConfig;
  userscript: UserScriptConfig;
};

export type BuildConfigs = {
  [P in keyof CompleteBuildConfigs]?: Partial<CompleteBuildConfigs[P]>;
};

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
  header: string;
  /*
   * Path to the entry file or directory (if passed a directory, index.ts is used, but all files are watched in watch mode)
   *
   * If assigned beyond the constructor, should be an absolute path
   *
   * @default ./index.ts
   */
  entry: string;
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
    this.entry ||= findFile("index.ts");
    this.header ||= findFile("header.txt");
  }
}
