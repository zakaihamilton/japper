import { Code } from 'lucide-react';
import Tooltip from './Tooltip';
import Panel from './Panel';
import styles from './TemplatePanel.module.css';

export default function TemplatePanel({
    template,
    onTemplateChange,
    separator,
    onSeparatorChange,
    availableKeys,
    onInsertKey,
}) {
    return (
        <Panel
            panelId="template"
            title="Template Pattern"
            icon={Code}
            collapseEdge="center"
            headerActions={(
                <div className={styles.separatorControl}>
                    <span className={styles.separatorLabel}>Join with:</span>
                    <input
                        type="text"
                        value={separator}
                        onChange={(e) => onSeparatorChange(e.target.value)}
                        className={styles.separatorInput}
                        placeholder="\n"
                    />
                </div>
            )}
            bodyClassName={styles.body}
        >
            <textarea
                className={styles.textarea}
                value={template}
                onChange={(e) => onTemplateChange(e.target.value)}
                placeholder="Use {{key}} to replace values..."
                spellCheck={false}
            />

            <div className={styles.keysSection}>
                <div className={styles.keysHeading}>Available Keys</div>
                <div className={styles.keysList}>
                    {availableKeys.length === 0 ? (
                        <span className={styles.keysEmpty}>Enter valid JSON to see keys</span>
                    ) : (
                        availableKeys.map((key) => (
                            <Tooltip key={key} content={`Insert {{${key}}}`}>
                                <button
                                    type="button"
                                    onClick={() => onInsertKey(key)}
                                    className={styles.keyButton}
                                >
                                    {key}
                                </button>
                            </Tooltip>
                        ))
                    )}
                </div>
            </div>
        </Panel>
    );
}
