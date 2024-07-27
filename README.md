Joines `index.ts` and `header.txt` into one js-file.

Replaces `{version}` in `header.txt` by `version` from `package.json`.

# Usage

```bash
# watch mode
bunx bun-build-userscript
# build
bunx bun-build-userscript --build
```

or

```bash
bun add --global bun-build-userscript

# watch
build-userscript
# build
build-userscript --build
```

# Options

## --out

Specify the output path.

```bash
build-userscript --out index.js
```

## --cfg

Pass custom bun config.
Refer to `BuildUserscriptConfig` for specific usersctipt options.

```bash
build-userscript --cfg config.ts
```

Should be exported with `export default`.

## --log-errors

Prints errors to the browser console.
