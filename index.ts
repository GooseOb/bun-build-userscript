import {readFile} from 'node:fs/promises';
import {BuildConfig} from 'bun';

export const print = (msg: string) => {
	process.stdout.write('\x1b[35m[bun-build-userscript]\x1b[0m ' + msg + '\n');
}

const postprocess = (text: string) =>
	'\n(function(){' +
	text.replace(/(?:\\u\S{4})+/g, ($0) => JSON.parse(`"${$0}"`)) +
	'})()';

export const build = (config: Partial<BuildConfig>) => {
	const startTime = performance.now();

	return Bun.build({
		entrypoints: ['index.ts'],
		outdir: '.',
		...config
	}).then(async (output) => {
		const {path} = output.outputs[0];
		await Bun.write(
			path,
			await readFile('header.txt', 'utf-8') +
			postprocess(await readFile(path, 'utf-8')));
		print(`done in ${performance.now() - startTime} ms`);
	})
}