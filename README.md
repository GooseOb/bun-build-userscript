Joines `index.ts` and `header.txt` into one js-file.

Replaces `{version}` in `header.txt` by `version` from `package.json`.

# Usage

```bash
# build
bunx bun-build-userscript
# watch
bunx bun-build-userscript --watch
```

or

```bash
bun add --global bun-build-userscript

# build
build-userscript
# watch
build-userscript --watch
```

# Options

## --out

Specify the output path.

```bash
build-userscript --out index.js
```

## --cfg

Pass custom bun config.
Refer to the type `BuildUserscriptConfig` for specific usersctipt options.

```bash
build-userscript --cfg config.ts
```

Should be exported with `export default`.

## --log-errors

Prints errors to the browser console.

## --no-clear

Disables clearing terminal in watch mode
