import { readFile } from 'node:fs/promises';
import type { BuildConfig } from 'bun';

export interface BunBuildUserscriptConfig extends BuildConfig {
	userscript: {
		logErrors: boolean
	}
}

export const print = (msg: string) => {
	process.stdout.write('\x1b[35m[bun-build-userscript]\x1b[0m ' + msg + '\n');
}

const postprocess = (code: string) =>
	'\n(function(){' +
	code.replace(/(?:\\u[A-Fa-f\d]{4})+/g, ($0) => JSON.parse(`"${$0}"`)) +
	'})()';
const addErrorLogging = (code: string) =>
	`try{${code}}catch(e){console.log("[%cuserscript-error%c] %s","color: red","",e.toString())}`;

export const build = (config: Partial<BunBuildUserscriptConfig>) => {
	const startTime = performance.now();

	return Bun.build({
		entrypoints: ['index.ts'],
		outdir: '.',
		...config
	}).then(async (output) => {
		if (!output.success) {
			print('error');
			process.exit(1);
		}
		const {path} = output.outputs[0];
		let result = postprocess(await readFile(path, 'utf-8'));
		if (config.userscript?.logErrors) result = addErrorLogging(result);
		await Bun.write(
			path,
			await readFile('header.txt', 'utf-8') + result
		);
		print(`done in ${performance.now() - startTime} ms`);
	})
}