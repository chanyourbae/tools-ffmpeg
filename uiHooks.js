// uiHooks.js
// Minimal glue: wires UI buttons to clean pipeline functions.

import { assert } from './utils.js';
import { processYZMethod, processSharkMethod } from './ffmpegPipeline.js';

export function bindStartButton({ startButtonId = 'startBtn' } = {}) {
	const btn = document.getElementById(startButtonId);
	assert(btn, `Start button not found: #${startButtonId}`);

	btn.addEventListener('click', async () => {
		// Decide which mode is active (same idea as original page)
		const sharkToggle = document.getElementById('sharkToggle');
		const yzToggle = document.getElementById('yzToggle');

		btn.disabled = true;
		const oldText = btn.innerText;
		btn.innerText = 'Processing…';

		try {
			if (sharkToggle?.checked) {
				await processSharkMethod();
				return;
			}
			if (yzToggle?.checked) {
				await processYZMethod();
				return;
			}
			throw new Error('No processing mode selected.');
		} catch (e) {
			console.error(e);
			alert(e?.message || String(e));
		} finally {
			btn.disabled = false;
			btn.innerText = oldText;
		}
	});
}
