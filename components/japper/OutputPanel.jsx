import { Check, Copy, Download, FileText } from 'lucide-react';
import styles from './OutputPanel.module.css';
import Panel from './Panel';
import Tooltip from './Tooltip';

export default function OutputPanel({
    outputPreview,
    outputLineCount,
    outputTruncated,
    copied,
    onCopy,
    onDownload,
}) {
    return (
        <Panel
            panelId="output"
            title="Output Result"
            icon={FileText}
            titleExtra={
                <>
                    {outputLineCount > 0 && (
                        <span className={styles.lineCount}>
                            {outputLineCount} {outputLineCount === 1 ? 'line' : 'lines'}
                        </span>
                    )}
                    {outputTruncated && (
                        <span className={styles.truncatedBadge}>(truncated preview)</span>
                    )}
                </>
            }
            collapseEdge="right"
            variant="output"
            bodyClassName={styles.body}
            headerActions={
                <>
                    <Tooltip content="Copy to clipboard">
                        <button
                            type="button"
                            onClick={onCopy}
                            className={`${styles.iconButton} ${copied ? styles.iconButtonCopied : ''}`}
                        >
                            {copied ? (
                                <Check className={styles.icon} />
                            ) : (
                                <Copy className={styles.icon} />
                            )}
                        </button>
                    </Tooltip>
                    <Tooltip content="Download">
                        <button type="button" onClick={onDownload} className={styles.iconButton}>
                            <Download className={styles.icon} />
                        </button>
                    </Tooltip>
                </>
            }
        >
            <textarea
                className={styles.textarea}
                value={outputPreview}
                readOnly
                placeholder="Result will appear here..."
            />
        </Panel>
    );
}
