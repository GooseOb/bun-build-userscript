#!/usr/bin/env bun

import { readFile, watch } from "node:fs/promises"

let startTime = performance.now();

const print = (msg: string) => {
	process.stdout.write('\x1b[35m[bun-build-userscript]\x1b[0m ' + msg + '\n');
}

let indexOfOutputOption = process.argv.indexOf('--out') + 1;
if (indexOfOutputOption === process.argv.length) {
	print('please, specify the output path');
	process.exit(1);
}

const naming = indexOfOutputOption ? process.argv[indexOfOutputOption] : 'dist.js';

const postprocess = (text: string) =>
	text.replace(/(?:\\u\S{4})+/g, ($0) => JSON.parse(`"${$0}"`));

const build = () =>
	Bun.build({
		entrypoints: ['index.ts'],
		outdir: '.',
		naming
	}).then(async (output) => {
		const {path} = output.outputs[0];
		await Bun.write(
			path,
			await readFile('header.txt', 'utf-8') + '\n' +
			postprocess(await readFile(path, 'utf-8')));
		print(`done in ${performance.now() - startTime} ms`);
	})

await build();

if (process.argv.includes('--build')) process.exit(0);

const watcher = watch('.');
for await (const event of watcher) {
	const {filename} = event;
	if (filename === 'index.ts' || filename === 'header.txt') {
		startTime = performance.now();
		build();
	}
}