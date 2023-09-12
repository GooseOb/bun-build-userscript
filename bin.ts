#!/usr/bin/env bun

import { watch } from "node:fs/promises"
import { build, print } from './index.ts';

let indexOfOutputOption = process.argv.indexOf('--out') + 1;
if (indexOfOutputOption === process.argv.length) {
	print('please, specify the output path');
	process.exit(1);
}

const config = {
	naming: indexOfOutputOption ? process.argv[indexOfOutputOption] : 'dist.js'
};

await build(config);

if (process.argv.includes('--build')) process.exit(0);

const watcher = watch('.');
for await (const event of watcher) {
	const {filename} = event;
	if (filename === 'index.ts' || filename === 'header.txt') build(config);
}