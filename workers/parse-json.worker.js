import { resolveDataArray } from '../lib/parseJson.js';

self.onmessage = (event) => {
    const { id, text, jsonPath } = event.data;

    try {
        const parsed = JSON.parse(text);
        const { dataToMap, resolvedPath, keys } = resolveDataArray(parsed, jsonPath);
        self.postMessage({ id, data: dataToMap, keys, resolvedPath });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
