'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { resolveDataArray } from '../../lib/parseJson';
import {
    TEXTAREA_FILE_LIMIT,
    OUTPUT_PREVIEW_LIMIT,
    SAMPLE_JSON,
    SAMPLE_TEMPLATE,
} from '../../lib/japperConstants';
import { filterData, renderOutput } from '../../lib/japperUtils';
import JapperHeader from './JapperHeader';
import JsonInputPanel from './JsonInputPanel';
import TemplatePanel from './TemplatePanel';
import OutputPanel from './OutputPanel';
import styles from './Japper.module.css';

export default function Japper() {
    const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
    const [template, setTemplate] = useState(SAMPLE_TEMPLATE);
    const [separator, setSeparator] = useState('\\n');
    const [parsedData, setParsedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterInput, setFilterInput] = useState('');
    const [jsonPath, setJsonPath] = useState('');
    const [resolvedPath, setResolvedPath] = useState('');
    const [parseError, setParseError] = useState(null);
    const [output, setOutput] = useState('');
    const [availableKeys, setAvailableKeys] = useState([]);
    const [copied, setCopied] = useState(false);
    const [inputSource, setInputSource] = useState('editor');
    const [loadedFile, setLoadedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const workerRef = useRef(null);
    const workerRequestIdRef = useRef(0);
    const largeFileTextRef = useRef(null);

    const parseInWorker = useCallback((text, path) => {
        if (!workerRef.current) return;

        workerRequestIdRef.current += 1;
        const id = workerRequestIdRef.current;
        setIsLoading(true);
        setParseError(null);
        workerRef.current.postMessage({ id, text, jsonPath: path });
    }, []);

    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../../workers/parse-json.worker.js', import.meta.url)
        );

        workerRef.current.onmessage = (event) => {
            const { id, data, keys, resolvedPath: path, error } = event.data;
            if (id !== workerRequestIdRef.current) return;

            setIsLoading(false);

            if (error) {
                setParseError(error);
                setParsedData([]);
                setAvailableKeys([]);
                setResolvedPath('');
                return;
            }

            setParsedData(data);
            setAvailableKeys(keys);
            setResolvedPath(path);
            setParseError(null);
        };

        return () => workerRef.current?.terminate();
    }, []);

    useEffect(() => {
        if (inputSource === 'file') return;

        try {
            if (!jsonInput.trim()) {
                setParsedData([]);
                setParseError(null);
                setAvailableKeys([]);
                setResolvedPath('');
                return;
            }

            const parsed = JSON.parse(jsonInput);
            const { dataToMap, resolvedPath: path, keys } = resolveDataArray(parsed, jsonPath);

            setParsedData(dataToMap);
            setAvailableKeys(keys);
            setResolvedPath(path);
            setParseError(null);
        } catch (err) {
            setParseError(err.message);
            setParsedData([]);
            setAvailableKeys([]);
            setResolvedPath('');
        }
    }, [jsonInput, jsonPath, inputSource]);

    useEffect(() => {
        if (inputSource !== 'file' || !largeFileTextRef.current) return;
        parseInWorker(largeFileTextRef.current, jsonPath);
    }, [jsonPath, inputSource, parseInWorker]);

    useEffect(() => {
        setFilteredData(filterData(parsedData, filterInput));
    }, [parsedData, filterInput]);

    useEffect(() => {
        if (filteredData.length === 0) {
            setOutput('');
            return;
        }

        setOutput(renderOutput(filteredData, template, separator));
    }, [filteredData, template, separator]);

    const resetInput = () => {
        workerRequestIdRef.current += 1;
        largeFileTextRef.current = null;
        setJsonInput('');
        setInputSource('editor');
        setLoadedFile(null);
        setParseError(null);
        setResolvedPath('');
        setParsedData([]);
        setAvailableKeys([]);
        setIsLoading(false);
    };

    const handleFileLoad = async (file) => {
        if (!file) return;

        setIsLoading(true);
        setParseError(null);

        try {
            const text = await file.text();

            if (file.size <= TEXTAREA_FILE_LIMIT) {
                largeFileTextRef.current = null;
                setInputSource('editor');
                setLoadedFile(null);
                setJsonInput(text);
                setIsLoading(false);
                return;
            }

            largeFileTextRef.current = text;
            setInputSource('file');
            setLoadedFile({ name: file.name, size: file.size });
            setJsonInput('');
        } catch (err) {
            setParseError(err.message);
            setIsLoading(false);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) handleFileLoad(file);
    };

    const handleCopy = () => {
        const textArea = document.createElement('textarea');
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
        setTemplate((prev) => `${prev}{{${key}}}`);
    };

    const loadSample = () => {
        workerRequestIdRef.current += 1;
        largeFileTextRef.current = null;
        setInputSource('editor');
        setLoadedFile(null);
        setJsonInput(SAMPLE_JSON);
        setTemplate(SAMPLE_TEMPLATE);
        setJsonPath('');
        setParseError(null);
    };

    const outputTruncated = output.length > OUTPUT_PREVIEW_LIMIT;
    const outputPreview = outputTruncated
        ? `${output.slice(0, OUTPUT_PREVIEW_LIMIT)}\n\n... Output truncated — use Download for full result`
        : output;

    const showAutoDetectedHint = !jsonPath.trim()
        && resolvedPath !== null
        && resolvedPath !== undefined
        && (parsedData.length > 0 || inputSource === 'file');

    return (
        <div className={styles.shell}>
            <JapperHeader onLoadSample={loadSample} />

            <main className={styles.main}>
                <JsonInputPanel
                    jsonInput={jsonInput}
                    onJsonInputChange={setJsonInput}
                    jsonPath={jsonPath}
                    onJsonPathChange={setJsonPath}
                    filterInput={filterInput}
                    onFilterInputChange={setFilterInput}
                    parseError={parseError}
                    parsedDataCount={parsedData.length}
                    filteredDataCount={filteredData.length}
                    inputSource={inputSource}
                    loadedFile={loadedFile}
                    resolvedPath={resolvedPath}
                    isLoading={isLoading}
                    isDragOver={isDragOver}
                    showAutoDetectedHint={showAutoDetectedHint}
                    onFileLoad={handleFileLoad}
                    onClear={resetInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                />

                <TemplatePanel
                    template={template}
                    onTemplateChange={setTemplate}
                    separator={separator}
                    onSeparatorChange={setSeparator}
                    availableKeys={availableKeys}
                    onInsertKey={insertKey}
                />

                <OutputPanel
                    outputPreview={outputPreview}
                    outputTruncated={outputTruncated}
                    copied={copied}
                    onCopy={handleCopy}
                    onDownload={handleDownload}
                />
            </main>
        </div>
    );
}
