/*
 * Copyright (C) 2023-2026  Yomitan Authors
 * Copyright (C) 2020-2022  Yomichan Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {log} from '../core/log.js';
import {WebExtension} from '../extension/web-extension.js';
import {Backend} from './backend.js';

/**
 * @param {string} url
 * @returns {Promise<{data: string, contentType: string}>}
 */
async function fetchLocalAudioData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Local server responded with HTTP status code ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const arrayBuffer = await response.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return {
        data: btoa(binary),
        contentType: contentType,
    };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FETCH_LOCAL_AUDIO_DATA') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        fetchLocalAudioData(message.url)
            .then((result) => sendResponse({success: true, data: result.data, contentType: result.contentType}))
            .catch((error) => sendResponse({success: false, error: /** @type {Error} */ (error).message}));
        return true;
    }
});

/** Entry point. */
async function main() {
    const webExtension = new WebExtension();
    log.configure(webExtension.extensionName);

    const backend = new Backend(webExtension);
    await backend.prepare();
}

void main();
