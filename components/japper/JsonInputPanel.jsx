import { AlertCircle, FileJson, Filter, Loader2, Route, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatFileSize, formatResolvedPath } from '../../lib/japperUtils';
import styles from './JsonInputPanel.module.css';
import Panel from './Panel';
import { usePanelGroup } from './PanelGroup';
import Tooltip from './Tooltip';

export default function JsonInputPanel({
    jsonInput,
    onJsonInputChange,
    jsonPath,
    onJsonPathChange,
    filterInput,
    onFilterInputChange,
    onApplyFilter,
    hasPendingFilter,
    parseError,
    parsedDataCount,
    filteredDataCount,
    inputSource,
    loadedFile,
    resolvedPath,
    isLoading,
    showAutoDetectedHint,
    onFileLoad,
    onClear,
}) {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { isCollapsed } = usePanelGroup('input');

    const handleDragOver = (event) => {
        if (isCollapsed) return;
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event) => {
        if (isCollapsed) return;
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event) => {
        if (isCollapsed) return;
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFileLoad(file);
    };

    return (
        <Panel
            panelId="input"
            title="Input JSON"
            icon={FileJson}
            collapseEdge="left"
            className={isDragOver ? styles.panelDragOver : ''}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            headerActions={
                <>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                    >
                        <Upload className={styles.actionIcon} /> Load File
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    >
                        <Trash2 className={styles.actionIcon} /> Clear
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className={styles.hiddenInput}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onFileLoad(file);
                            e.target.value = '';
                        }}
                    />
                </>
            }
            footer={
                <>
                    <div className={styles.stats}>
                        <span>{parsedDataCount} items detected</span>
                        <span>{filteredDataCount} after filter</span>
                    </div>
                    <div className={styles.fieldRow}>
                        <Route className={styles.fieldIcon} />
                        <input
                            type="text"
                            value={jsonPath}
                            onChange={(e) => onJsonPathChange(e.target.value)}
                            placeholder="JSON path (optional): response.data"
                            className={styles.fieldInput}
                        />
                    </div>
                    {showAutoDetectedHint && (
                        <p className={styles.autoDetectHint}>
                            Auto-detected: {formatResolvedPath(resolvedPath)}
                        </p>
                    )}
                    <form
                        className={styles.filterRow}
                        onSubmit={(event) => {
                            event.preventDefault();
                            onApplyFilter();
                        }}
                    >
                        <div className={styles.fieldRow}>
                            <Filter className={styles.fieldIcon} />
                            <input
                                type="text"
                                value={filterInput}
                                onChange={(e) => onFilterInputChange(e.target.value)}
                                placeholder='Filter: user="abc", role="admin"'
                                className={`${styles.fieldInput} ${styles.fieldInputPlain}`}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`${styles.applyButton} ${hasPendingFilter ? styles.applyButtonPending : ''}`}
                        >
                            Apply
                        </button>
                    </form>
                </>
            }
        >
            {inputSource === 'file' && loadedFile ? (
                <div className={styles.fileSummaryWrap}>
                    <div className={styles.fileSummaryCard}>
                        <FileJson className={styles.fileSummaryIcon} />
                        <Tooltip content={loadedFile.name}>
                            <p className={`${styles.fileName} ${styles.fileNameTooltip}`}>
                                {loadedFile.name}
                            </p>
                        </Tooltip>
                        <p className={styles.fileSize}>{formatFileSize(loadedFile.size)}</p>
                        {resolvedPath !== undefined && (
                            <p className={styles.filePath}>
                                Path: {formatResolvedPath(resolvedPath)}
                            </p>
                        )}
                        <p className={styles.fileItems}>{parsedDataCount} items loaded</p>
                    </div>
                </div>
            ) : (
                <textarea
                    className={`${styles.textarea} ${parseError ? styles.textareaError : ''}`}
                    value={jsonInput}
                    onChange={(e) => onJsonInputChange(e.target.value)}
                    placeholder="Paste JSON or load a file (up to 10MB shown here)..."
                    spellCheck={false}
                />
            )}

            {isDragOver && (
                <div className={styles.dropOverlay}>
                    <p className={styles.dropText}>Drop JSON file</p>
                </div>
            )}

            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.loadingContent}>
                        <Loader2 className={styles.loadingIcon} />
                        <span className={styles.loadingText}>Loading file...</span>
                    </div>
                </div>
            )}

            {parseError && (
                <div className={styles.errorBanner}>
                    <AlertCircle className={styles.errorIcon} />
                    <span>{parseError}</span>
                </div>
            )}
        </Panel>
    );
}
