import { RefreshCw } from 'lucide-react';
import styles from './JapperHeader.module.css';

export default function JapperHeader({ onLoadSample }) {
    return (
        <header className={styles.header}>
            <div className={styles.brand}>
                <div className={styles.logo}>
                    <RefreshCw className={styles.logoIcon} />
                </div>
                <div>
                    <h1 className={styles.title}>Japper</h1>
                    <p className={styles.subtitle}>JSON Mapper &amp; Formatter</p>
                </div>
            </div>
            <div className={styles.actions}>
                <button type="button" onClick={onLoadSample} className={styles.sampleButton}>
                    Load Sample
                </button>
            </div>
        </header>
    );
}
