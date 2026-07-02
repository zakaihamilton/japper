import { FileText, Copy, Download, Check } from 'lucide-react';
import Tooltip from './Tooltip';
import Panel from './Panel';
import styles from './OutputPanel.module.css';

export default function OutputPanel({
    outputPreview,
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
            titleExtra={outputTruncated && (
                <span className={styles.truncatedBadge}>(truncated preview)</span>
            )}
            collapseEdge="right"
            variant="output"
            bodyClassName={styles.body}
            headerActions={(
                <>
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
                </>
            )}
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
