import { getNestedValue } from './parseJson';

export const filterData = (data, filterString) => {
    if (!filterString?.trim()) return data;

    const filters = [];
    const regex = /([\w.-]+)\s*=\s*"([^"]*)"/g;
    for (const match of filterString.matchAll(regex)) {
        filters.push({ key: match[1], value: match[2] });
    }

    if (filters.length === 0) return data;

    return data.filter((item) => {
        return filters.every(({ key, value }) => {
            const itemValue = getNestedValue(item, key);
            return String(itemValue) === value;
        });
    });
};

export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const formatResolvedPath = (path) => (path ? path : '(root array)');

const getActualSeparator = (separator) => {
    if (separator === '\\n') return '\n';
    if (separator === '\\t') return '\t';
    if (separator === ',') return ',';
    return separator;
};

export const renderOutput = (filteredData, template, separator) => {
    const actualSeparator = getActualSeparator(separator);

    const processed = filteredData.map((item) => {
        return template.replace(/{{(.*?)}}/g, (_match, key) => {
            const trimmedKey = key.trim();
            const value = getNestedValue(item, trimmedKey);

            if (value === undefined || value === null) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        });
    });

    return processed.join(actualSeparator);
};
