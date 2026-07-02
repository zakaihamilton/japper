import { FileText, Copy, Download, Check } from 'lucide-react';
import Tooltip from './Tooltip';
import styles from './OutputPanel.module.css';

export default function OutputPanel({
    outputPreview,
    outputTruncated,
    copied,
    onCopy,
    onDownload,
}) {
    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <FileText className={styles.panelIcon} />
                    Output Result
                    {outputTruncated && (
                        <span className={styles.truncatedBadge}>(truncated preview)</span>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <Tooltip content="Copy to clipboard">
                        <button
                            type="button"
                            onClick={onCopy}
                            className={`${styles.iconButton} ${copied ? styles.iconButtonCopied : ''}`}
                        >
                            {copied ? <Check className={styles.icon} /> : <Copy className={styles.icon} />}
                        </button>
                    </Tooltip>
                    <Tooltip content="Download">
                        <button
                            type="button"
                            onClick={onDownload}
                            className={styles.iconButton}
                        >
                            <Download className={styles.icon} />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className={styles.body}>
                <textarea
                    className={styles.textarea}
                    value={outputPreview}
                    readOnly
                    placeholder="Result will appear here..."
                />
            </div>
        </div>
    );
}
