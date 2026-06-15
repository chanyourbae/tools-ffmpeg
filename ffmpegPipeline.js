// ffmpegPipeline.js
// Clean, readable implementation of the processing pipeline.
//
// Requirements assumed (same as original project):
// - window.ffmpeg is an FFmpeg.wasm instance created by the page (FFmpeg.create)
// - window.selectedFile is set (File)
// - window.isEngineLoaded indicates ffmpeg.load() done
// - window.downloadBlob exists OR we use our own download helper

import { assert, basenameNoExt, downloadBlobBytes, getCheckedRadioValue } from './utils.js';

function requireEngine() {
	assert(window.ffmpeg, 'FFmpeg instance not found (window.ffmpeg).');
	assert(window.isEngineLoaded, 'FFmpeg engine is not loaded yet.');
}

function outputName(prefix = 'YZ_', ext = '.mp4') {
	const file = window.selectedFile;
	assert(file && file.name, 'No selected file.');
	return `${prefix}${basenameNoExt(file.name)}${ext}`;
}

async function writeInputToFs(fsName, file) {
	window.ffmpeg.FS('writeFile', fsName, await FFmpeg.fetchFile(file));
}

function readFileFromFs(fsName) {
	return window.ffmpeg.FS('readFile', fsName);
}

function cleanupFs(names) {
	for (const n of names) {
		try {
			window.ffmpeg.FS('unlink', n);
		} catch {
			// ignore
		}
	}
}

async function runFfmpeg(args) {
	await window.ffmpeg.run(...args);
}

/**
 * YZ method (clean):
 * - Reads "yzOpt" radio: fast/other
 * - Fast path: remux to .ts then download blob
 * - Normal path: can use bitrate if window.currentBitrateKbps exists (same idea as original)
 */
export async function processYZMethod() {
	const file = window.selectedFile;
	assert(file instanceof File, 'selectedFile must be a File');

	requireEngine();

	const opt = getCheckedRadioValue('yzOpt') || 'fast';
	const outName = outputName('YZ_', '.mp4');

	// NOTE: The original tool sometimes produces TS then wraps/renames.
	// We keep the same behavior but make it explicit.
	if (opt === 'fast') {
		// Fast: remux only (no re-encode)
		const inName = 'in.mp4';
		const outNameFs = 'out.ts';
		try {
			await writeInputToFs(inName, file);
			await runFfmpeg(['-i', inName, '-c', 'copy', outNameFs]);
			const data = readFileFromFs(outNameFs);
			downloadBlobBytes(data.buffer, outName, 'video/mp4');
		} finally {
			cleanupFs([inName, outNameFs]);
		}
		return;
	}

	// Normal path: transcode / enforce settings
	// The original project dynamically sets bitrate. We'll respect currentBitrateKbps when present.
	const bitrateK = typeof window.currentBitrateKbps === 'number' ? window.currentBitrateKbps : null;
	const extraBitrateArgs = bitrateK ? ['-b:v', `${Math.max(1000, Math.floor(bitrateK))}k`] : [];

	const inName = 'in.mp4';
	const outFs = 'tmp.mp4';
	try {
		await writeInputToFs(inName, file);
		await runFfmpeg(['-i', inName, ...extraBitrateArgs, outFs]);
		const data = readFileFromFs(outFs);
		downloadBlobBytes(data.buffer, outName, 'video/mp4');
	} finally {
		cleanupFs([inName, outFs]);
	}
}

/**
 * Shark method wrapper (clean): calls existing window.processSharkMethod from efgh.js
 * because efgh.js already contains a readable MP4 box patcher.
 */
export async function processSharkMethod() {
	assert(typeof window.processSharkMethod === 'function', 'processSharkMethod is not available. Make sure efgh.js is loaded.');
	return await window.processSharkMethod();
}
