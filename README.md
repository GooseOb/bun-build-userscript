Builds `index.ts` and `header.txt` (configurable) into a single js-file.

Replaces `{version}` in `header.txt` by `version` from `package.json`.

# Install

```sh
bun add -D bun-build-userscript
# or
npm i -D bun-build-userscript
```

# Usage

## From package.json

```json
{
  "scripts": {
    "build": "build-userscript",
    "watch": "build-userscript --watch"
  }
}
```

## Globally

```sh
bun add --global bun-build-userscript

# build
build-userscript
# watch
build-userscript --watch
```

## Globally (without installing)

```sh
# build
bunx bun-build-userscript
# watch
bunx bun-build-userscript --watch
```

# Options

## --version -v

Prints the current package version.

## --watch

Listens for changes in the source file(s) and rebuilds.

## --cfg

Path to your config.

```bash
build-userscript --cfg my_config.ts
# JavaScript is also supported
build-userscript --cfg my_config.js
```

Example config:

```ts
// EXPORTING BOTH `userscript` AND `bun` IS OPTIONAL.
// ALL OPTIONS ARE OPTIONAL

import type { BuildConfigs } from "bun-build-userscript";

export const userscript: BuildConfigs['userscript'] = {
  // may be useful in watch mode
  before: async ({ bun, userscript }) => {
    // you can add additional entrypoints
    bun.entrypoints.push(additionalFile);
    // or redefine some variables
    bun.define = JSON.parse(await readFile("constants.json", "utf8"));
  },
  transform: (code) => code;
  // default options (simplified)
  logErrors: process.argv.includes("--log-errors"),
  clearTerminal: !(isBuild || process.argv.includes("--no-clear")),
  header: getArg("--header") || "header.txt",
  entry: getArg("--entry") ||  "index.ts",
};

// BuildConfigs["bun"] is an alias to import("bun").BuildConfig
export const bun: BuildConfigs["bun"] = {
  // default options (simplified)
  // if you want to change entrypoints, it's better to use `userscript.before` instead
  entrypoints: [getIndexTs(userscript.entry)],
  naming: "script.user.js",
  outdir: ".",
};
```

## --out

Output file path.

Default: `user.script.js`

Config: `bun.naming` (can be combined with `bun.outdir`)

```bash
build-userscript --out index.js
```

## --log-errors

Do print errors to the browser console.

Default: `false`

Config: `bun.logErrors`

Recommended:

```ts
{
  logErrors: !process.argv.includes("--build"),
}
```

## --no-clear

Disables clearing terminal in watch mode.

Default: `false`

Config: `userscript.clearTerminal`

## --header

Path to your header file.

Default: `header.txt` or `src/header.txt`

Config: `userscript.header`

## --entry

Path to your source file/dir.

If it's a directory, entry point is resolved to `index.ts`
in this directory, but all files are watched in watch mode.

Default: `index.ts` or `src/index.ts`

Config: `userscript.entry`

## --delay

Delay (milliseconds) between file change and build in watch mode.

Introduced because of the issue with bun not being able to find the changed file.

Default: `100`

Config: not available

## userscript.transform

NOT AVAILABLE IN CLI

Function to transform the code after it's built.

Async: not supported.

Default: `undefined`

## userscript.before

NOT AVAILABLE IN CLI

Function to run before the build.

Takes modified `bun` and `userscript` objects, returns nothing.

Async: supported.

Default: `undefined`
