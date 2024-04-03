Building index.ts and header.txt into one js-file

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
Add error catching and printing to the console

# Projects using this tool

- [usos-dark](https://github.com/GooseOb/usos-dark)
- [YT-Defaulter](https://github.com/GooseOb/YT-Defaulter)
