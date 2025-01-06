export const print = (
  msg: string,
  writer: { write(msg: string): void } = process.stdout,
) => {
  writer.write(`\x1b[35m[bun-build-userscript]\x1b[0m ${msg}\n`);
};
