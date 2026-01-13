'use client'

import { useState, useEffect } from 'react';
import {
    FileJson,
    Copy,
    Download,
    Trash2,
    Code,
    FileText,
    RefreshCw,
    AlertCircle,
    Check,
    Filter
} from 'lucide-react';

// --- Utility Functions ---

// Safely access nested objects using string dot notation (e.g. "address.city")
const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        current = current[key];
    }

    return current;
};

const filterData = (data, filterString) => {
    if (!filterString || !filterString.trim()) return data;

    const filters = [];
    const regex = /([\w.-]+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = regex.exec(filterString)) !== null) {
        filters.push({ key: match[1], value: match[2] });
    }

    if (filters.length === 0) return data;

    return data.filter(item => {
        return filters.every(({ key, value }) => {
            const itemValue = getNestedValue(item, key);
            return String(itemValue) === value;
        });
    });
};

// The sample data to help users get started
const SAMPLE_JSON = JSON.stringify([
    {
        "id": 101,
        "product": "Mechanical Keyboard",
        "price": 120.50,
        "tags": ["electronics", "office"],
        "stock": { "warehouse": 50, "retail": 12 }
    },
    {
        "id": 102,
        "product": "Gaming Mouse",
        "price": 59.99,
        "tags": ["electronics", "gaming"],
        "stock": { "warehouse": 100, "retail": 25 }
    }
], null, 2);

const SAMPLE_TEMPLATE = `<item id="{{id}}">
  <name>{{product}}</name>
  <price currency="USD">{{price}}</price>
  <inventory total="{{stock.warehouse}}"/>
</item>`;

export default function App() {
    // --- State ---
    const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
    const [template, setTemplate] = useState(SAMPLE_TEMPLATE);
    const [separator, setSeparator] = useState('\\n'); // Visual representation of separator
    const [parsedData, setParsedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterInput, setFilterInput] = useState('');
    const [parseError, setParseError] = useState(null);
    const [output, setOutput] = useState('');
    const [availableKeys, setAvailableKeys] = useState([]);
    const [copied, setCopied] = useState(false);

    // --- Effects ---

    // Parse JSON whenever input changes
    useEffect(() => {
        try {
            if (!jsonInput.trim()) {
                setParsedData([]);
                setParseError(null);
                setAvailableKeys([]);
                return;
            }

            const parsed = JSON.parse(jsonInput);

            // Normalize data: We always want an array of objects to map over
            let dataToMap = [];
            if (Array.isArray(parsed)) {
                dataToMap = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
                dataToMap = [parsed];
            } else {
                throw new Error("JSON must be an array or an object.");
            }

            setParsedData(dataToMap);
            setParseError(null);

            // Extract keys for the sidebar helper
            if (dataToMap.length > 0) {
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
                dataToMap.forEach(item => extractKeys(item));
                setAvailableKeys(Array.from(keys));
            }

        } catch (err) {
            setParseError(err.message);
            setParsedData([]);
            setAvailableKeys([]);
        }
    }, [jsonInput]);

    // Filter data whenever parsedData or filterInput changes
    useEffect(() => {
        setFilteredData(filterData(parsedData, filterInput));
    }, [parsedData, filterInput]);

    // Generate Output whenever Data, Template, or Separator changes
    useEffect(() => {
        if (filteredData.length === 0) {
            setOutput('');
            return;
        }

        // Determine actual separator character
        let actualSeparator = '\n';
        if (separator === '\\n') actualSeparator = '\n';
        else if (separator === '\\t') actualSeparator = '\t';
        else if (separator === ',') actualSeparator = ',';
        else actualSeparator = separator;

        const processed = filteredData.map(item => {
            // Regex to find {{ key }} patterns
            return template.replace(/{{(.*?)}}/g, (match, key) => {
                const trimmedKey = key.trim();
                const value = getNestedValue(item, trimmedKey);

                if (value === undefined || value === null) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            });
        });

        setOutput(processed.join(actualSeparator));
    }, [filteredData, template, separator]);

    // --- Handlers ---

    const handleCopy = () => {
        // navigator.clipboard.writeText() often fails in iframes, using execCommand as fallback
        const textArea = document.createElement("textarea");
        textArea.value = output;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
        document.body.removeChild(textArea);
    };

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'japper-output.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const insertKey = (key) => {
        setTemplate(prev => `${prev}{{${key}}}`);
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Japper</h1>
                        <p className="text-xs text-slate-500">JSON Mapper & Formatter</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setJsonInput(SAMPLE_JSON); setTemplate(SAMPLE_TEMPLATE); }}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Load Sample
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden h-[calc(100vh-76px)]">

                {/* Column 1: Input JSON */}
                <div className="lg:col-span-4 flex flex-col bg-white h-full min-h-[300px]">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <FileJson className="w-4 h-4" />
                            Input JSON
                        </div>
                        <button
                            onClick={() => setJsonInput('')}
                            className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    </div>
                    <div className="relative flex-1">
                        <textarea
                            className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${parseError ? 'bg-red-50' : 'bg-white'}`}
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder="Paste array of objects here..."
                            spellCheck={false}
                        />
                        {parseError && (
                            <div className="absolute bottom-4 left-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm shadow-sm border border-red-200 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{parseError}</span>
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
                        <div className="text-xs text-slate-500 flex justify-between">
                            <span>{parsedData.length} items detected</span>
                            <span>{filteredData.length} after filter</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2 py-1">
                            <Filter className="w-3 h-3 text-slate-400" />
                            <input
                                type="text"
                                value={filterInput}
                                onChange={(e) => setFilterInput(e.target.value)}
                                placeholder='Filter: user="abc", role="admin"'
                                className="w-full text-xs outline-none bg-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Column 2: Template Logic */}
                <div className="lg:col-span-4 flex flex-col bg-white h-full min-h-[300px]">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <Code className="w-4 h-4" />
                            Template Pattern
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Join with:</span>
                            <input
                                type="text"
                                value={separator}
                                onChange={(e) => setSeparator(e.target.value)}
                                className="w-16 px-2 py-0.5 text-xs border border-slate-300 rounded bg-white font-mono"
                                placeholder="\n"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <textarea
                            className="w-full flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:bg-slate-50 transition-colors border-b border-slate-100"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder="Use {{key}} to replace values..."
                            spellCheck={false}
                        />

                        {/* Helper Keys Area */}
                        <div className="h-1/3 bg-slate-50 border-t border-slate-200 overflow-y-auto">
                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-50">
                                Available Keys
                            </div>
                            <div className="px-4 pb-4 flex flex-wrap gap-2">
                                {availableKeys.length === 0 ? (
                                    <span className="text-xs text-slate-400 italic">Enter valid JSON to see keys</span>
                                ) : (
                                    availableKeys.map(key => (
                                        <button
                                            key={key}
                                            onClick={() => insertKey(key)}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                                            title={`Insert {{${key}}}`}
                                        >
                                            {key}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Output */}
                <div className="lg:col-span-4 flex flex-col bg-slate-50 h-full min-h-[300px]">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <FileText className="w-4 h-4" />
                            Output Result
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className={`p-1.5 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-700' : 'hover:bg-slate-200 text-slate-600'}`}
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                                title="Download"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="relative flex-1 bg-slate-800 overflow-hidden">
                        <textarea
                            className="w-full h-full p-4 font-mono text-sm resize-none bg-slate-800 text-slate-300 focus:outline-none"
                            value={output}
                            readOnly
                            placeholder="Result will appear here..."
                        />
                    </div>
                </div>

            </main>
        </div>
    );
}