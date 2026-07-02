import { useRef } from 'react';
import {
    FileJson,
    Trash2,
    AlertCircle,
    Filter,
    Upload,
    Loader2,
    Route,
} from 'lucide-react';
import { formatFileSize, formatResolvedPath } from '../../lib/japperUtils';
import Tooltip from './Tooltip';
import styles from './JsonInputPanel.module.css';

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
    isDragOver,
    showAutoDetectedHint,
    onFileLoad,
    onClear,
    onDragOver,
    onDragLeave,
    onDrop,
}) {
    const fileInputRef = useRef(null);

    return (
        <div
            className={`${styles.panel} ${isDragOver ? styles.panelDragOver : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <FileJson className={styles.panelIcon} />
                    Input JSON
                </div>
                <div className={styles.headerActions}>
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
                </div>
            </div>

            <div className={styles.body}>
                {inputSource === 'file' && loadedFile ? (
                    <div className={styles.fileSummaryWrap}>
                        <div className={styles.fileSummaryCard}>
                            <FileJson className={styles.fileSummaryIcon} />
                            <Tooltip content={loadedFile.name}>
                                <p className={`${styles.fileName} ${styles.fileNameTooltip}`}>
                                    {loadedFile.name}
                                </p>
                            </Tooltip>
                            <p className={styles.fileSize}>
                                {formatFileSize(loadedFile.size)}
                            </p>
                            {resolvedPath !== undefined && (
                                <p className={styles.filePath}>
                                    Path: {formatResolvedPath(resolvedPath)}
                                </p>
                            )}
                            <p className={styles.fileItems}>
                                {parsedDataCount} items loaded
                            </p>
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
            </div>

            <div className={styles.footer}>
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
                <div className={styles.filterRow}>
                    <div className={styles.fieldRow}>
                        <Filter className={styles.fieldIcon} />
                        <input
                            type="text"
                            value={filterInput}
                            onChange={(e) => onFilterInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onApplyFilter();
                            }}
                            placeholder='Filter: user="abc", role="admin"'
                            className={`${styles.fieldInput} ${styles.fieldInputPlain}`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onApplyFilter}
                        className={`${styles.applyButton} ${hasPendingFilter ? styles.applyButtonPending : ''}`}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
