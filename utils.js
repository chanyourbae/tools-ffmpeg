// utils.js
// Small helpers used by the clean pipeline.

export function assert(condition, message) {
	if (!condition) throw new Error(message);
}

export function basenameNoExt(filename) {
	return filename.replace(/\.[^/.]+$/, '');
}

export function downloadBlobBytes(bytes, filename, mime = 'application/octet-stream') {
	const blob = new Blob([bytes], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	try {
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
	} finally {
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 30_000);
	}
}

export function getCheckedRadioValue(name) {
	const el = document.querySelector(`input[name="${name}"]:checked`);
	return el ? el.value : null;
}
