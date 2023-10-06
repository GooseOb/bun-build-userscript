#!/usr/bin/env bun

import { watch } from "node:fs/promises"
import {build, BunBuildUserscriptConfig, print} from './index.ts';
import * as path from 'path';

let indexOfOutputOption = process.argv.indexOf('--out') + 1;
if (indexOfOutputOption === process.argv.length) {
	print('please, specify the output path');
	process.exit(1);
}

let indexOfConfigOption = process.argv.indexOf('--cfg') + 1;
if (indexOfConfigOption === process.argv.length) {
	print('please, specify the config path');
	process.exit(1);
}

const config = {
	userscript: {
		logErrors: process.argv.includes('--log-errors')
	},
	...(indexOfConfigOption ? (await import(
		path.resolve(process.cwd(), process.argv[indexOfConfigOption])
	)).default : {naming: 'dist.js'}),
} satisfies BunBuildUserscriptConfig;
if (indexOfOutputOption) config.naming = process.argv[indexOfOutputOption];

await build(config);

if (process.argv.includes('--build')) process.exit(0);

const watcher = watch('.');
for await (const event of watcher) {
	const {filename} = event;
	if (filename === 'index.ts' || filename === 'header.txt') await build(config);
}