const KEY_SAMPLE_SIZE = 50;

export function getNestedValue(obj, path) {
    if (!path) return undefined;
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        current = current[key];
    }

    return current;
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasObjectElements(arr) {
    return arr.some((item) => isPlainObject(item));
}

function normalizeToDataArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (isPlainObject(value)) {
        return [value];
    }
    throw new Error('JSON path must resolve to an array or an object.');
}

function collectObjectArrayPaths(value, prefix, results) {
    if (Array.isArray(value)) {
        if (hasObjectElements(value)) {
            results.push({ path: prefix, length: value.length, data: value });
        }
        return;
    }

    if (!isPlainObject(value)) return;

    for (const key of Object.keys(value)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        collectObjectArrayPaths(value[key], fullPath, results);
    }
}

function autoDetectArray(parsed) {
    if (Array.isArray(parsed)) {
        if (parsed.length === 0 || hasObjectElements(parsed)) {
            return { dataToMap: parsed, resolvedPath: '' };
        }
        throw new Error('JSON array must contain objects.');
    }

    const candidates = [];
    collectObjectArrayPaths(parsed, '', candidates);

    if (candidates.length > 0) {
        const best = candidates.reduce((a, b) => (a.length >= b.length ? a : b));
        return { dataToMap: best.data, resolvedPath: best.path };
    }

    if (isPlainObject(parsed)) {
        return { dataToMap: [parsed], resolvedPath: '' };
    }

    throw new Error('JSON must be an array or an object.');
}

function extractKeys(dataToMap, sampleSize = KEY_SAMPLE_SIZE) {
    const keys = new Set();

    const extractKeysFromObj = (obj, prefix = '') => {
        Object.keys(obj).forEach((key) => {
            const value = obj[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;
            keys.add(fullKey);
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                extractKeysFromObj(value, fullKey);
            }
        });
    };

    dataToMap.slice(0, sampleSize).forEach((item) => {
        if (isPlainObject(item)) {
            extractKeysFromObj(item);
        }
    });

    return Array.from(keys);
}

export function resolveDataArray(parsed, jsonPath) {
    const trimmedPath = jsonPath?.trim() ?? '';

    if (trimmedPath) {
        const value = getNestedValue(parsed, trimmedPath);
        if (value === undefined) {
            throw new Error(`Path not found: ${trimmedPath}`);
        }
        const dataToMap = normalizeToDataArray(value);
        return {
            dataToMap,
            resolvedPath: trimmedPath,
            keys: extractKeys(dataToMap),
        };
    }

    const { dataToMap, resolvedPath } = autoDetectArray(parsed);
    return {
        dataToMap,
        resolvedPath,
        keys: extractKeys(dataToMap),
    };
}
