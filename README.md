Building `index.ts` and `header.txt` into one js-file

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

# watch mode
bun build-userscript
# build
bun build-userscript --build
```

# Options

## --out

Specify the output path

```bash
bun build-userscript --out index.js
```

## --cfg

Pass custom bun config

```bash
bun build-userscript --cfg config.ts
```

Should be exported by `export default`

## --log-errors
