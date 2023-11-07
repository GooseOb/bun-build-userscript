#!/usr/bin/env bun

import { watch } from "node:fs/promises"
import { build, BunBuildUserscriptConfig, print } from './index.ts';
import * as path from 'path';

const getOptionContent = (name: string, what: string) => {
	const index = process.argv.indexOf(name) + 1;
	if (index === process.argv.length) {
		print('please, specify the ' + what);
		process.exit(1);
	}
	return index && process.argv[index];
};

const outputOption = getOptionContent('--out', 'output path');
const configOption = getOptionContent('--cfg', 'config path');

const config = {
	userscript: {
		logErrors: process.argv.includes('--log-errors')
	},
	...(configOption ? (await import(
		path.resolve(process.cwd(), configOption)
	)).default : {naming: 'dist.js'}),
} satisfies BunBuildUserscriptConfig;
if (outputOption) config.naming = outputOption;

await build(config);

if (process.argv.includes('--build')) process.exit(0);

for await (const event of watch('.')) {
	const {filename} = event;
	if (filename === 'index.ts' || filename === 'header.txt') await build(config);
}