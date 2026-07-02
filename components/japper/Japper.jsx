'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    OUTPUT_PREVIEW_LIMIT,
    SAMPLE_JSON,
    SAMPLE_TEMPLATE,
    TEXTAREA_FILE_LIMIT,
} from '../../lib/japperConstants';
import { filterData, renderOutput } from '../../lib/japperUtils';
import { resolveDataArray } from '../../lib/parseJson';
import styles from './Japper.module.css';
import JapperHeader from './JapperHeader';
import JsonInputPanel from './JsonInputPanel';
import OutputPanel from './OutputPanel';
import PanelGroup from './PanelGroup';
import TemplatePanel from './TemplatePanel';

export default function Japper() {
    const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
    const [template, setTemplate] = useState(SAMPLE_TEMPLATE);
    const [separator, setSeparator] = useState('\\n');
    const [parsedData, setParsedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterInput, setFilterInput] = useState('');
    const [appliedFilter, setAppliedFilter] = useState('');
    const [jsonPath, setJsonPath] = useState('');
    const [resolvedPath, setResolvedPath] = useState('');
    const [parseError, setParseError] = useState(null);
    const [output, setOutput] = useState('');
    const [availableKeys, setAvailableKeys] = useState([]);
    const [copied, setCopied] = useState(false);
    const [inputSource, setInputSource] = useState('editor');
    const [loadedFile, setLoadedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
            new URL('../../workers/parse-json.worker.js', import.meta.url),
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
        setFilteredData(filterData(parsedData, appliedFilter));
    }, [parsedData, appliedFilter]);

    const handleApplyFilter = () => {
        setAppliedFilter(filterInput);
    };

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
        setFilterInput('');
        setAppliedFilter('');
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
    const outputLineCount = output ? output.split('\n').length : 0;

    const showAutoDetectedHint =
        !jsonPath.trim() &&
        resolvedPath !== null &&
        resolvedPath !== undefined &&
        (parsedData.length > 0 || inputSource === 'file');

    return (
        <div className={styles.shell}>
            <JapperHeader onLoadSample={loadSample} />

            <PanelGroup className={styles.main} columns={['input', 'template', 'output']}>
                <JsonInputPanel
                    jsonInput={jsonInput}
                    onJsonInputChange={setJsonInput}
                    jsonPath={jsonPath}
                    onJsonPathChange={setJsonPath}
                    filterInput={filterInput}
                    onFilterInputChange={setFilterInput}
                    onApplyFilter={handleApplyFilter}
                    hasPendingFilter={filterInput !== appliedFilter}
                    parseError={parseError}
                    parsedDataCount={parsedData.length}
                    filteredDataCount={filteredData.length}
                    inputSource={inputSource}
                    loadedFile={loadedFile}
                    resolvedPath={resolvedPath}
                    isLoading={isLoading}
                    showAutoDetectedHint={showAutoDetectedHint}
                    onFileLoad={handleFileLoad}
                    onClear={resetInput}
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
                    outputLineCount={outputLineCount}
                    outputTruncated={outputTruncated}
                    copied={copied}
                    onCopy={handleCopy}
                    onDownload={handleDownload}
                />
            </PanelGroup>
        </div>
    );
}
