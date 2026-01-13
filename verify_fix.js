
const dataToMap = [
    {
        "id": 101,
        "product": "Mechanical Keyboard"
    },
    {
        "id": 102,
        "product": "Gaming Mouse",
        "extra_info": "wireless"
    }
];

const keys = new Set();
const extractKeys = (obj, prefix = '') => {
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.add(fullKey);
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            extractKeys(value, fullKey);
        }
    });
};

if (dataToMap.length > 0) {
    // Fix: iterate over all items
    dataToMap.forEach(item => {
        extractKeys(item);
    });
}

const availableKeys = Array.from(keys);
console.log("Available keys:", availableKeys);

if (!availableKeys.includes('extra_info')) {
    console.log("FAIL: 'extra_info' key is missing!");
} else {
    console.log("PASS: 'extra_info' key is present.");
}
