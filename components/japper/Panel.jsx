'use client';

import {
    ChevronDown,
    FoldHorizontal,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    UnfoldHorizontal,
} from 'lucide-react';
import styles from './Panel.module.css';
import { usePanelGroup } from './PanelGroup';
import Tooltip from './Tooltip';

function CollapseToggleIcon({ collapseEdge, isCollapsed }) {
    if (collapseEdge === 'left') {
        return (
            <>
                <ChevronDown
                    className={`${styles.collapseIcon} ${styles.collapseIconMobile} ${isCollapsed ? '' : styles.collapseIconRotated}`}
                />
                {isCollapsed ? (
                    <PanelLeftOpen
                        className={`${styles.collapseIcon} ${styles.collapseIconDesktop}`}
                    />
                ) : (
                    <PanelLeftClose
                        className={`${styles.collapseIcon} ${styles.collapseIconDesktop}`}
                    />
                )}
            </>
        );
    }

    if (collapseEdge === 'right') {
        return (
            <>
                <ChevronDown
                    className={`${styles.collapseIcon} ${styles.collapseIconMobile} ${isCollapsed ? '' : styles.collapseIconRotated}`}
                />
                {isCollapsed ? (
                    <PanelRightOpen
                        className={`${styles.collapseIcon} ${styles.collapseIconDesktop}`}
                    />
                ) : (
                    <PanelRightClose
                        className={`${styles.collapseIcon} ${styles.collapseIconDesktop}`}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <ChevronDown
                className={`${styles.collapseIcon} ${styles.collapseIconMobile} ${isCollapsed ? '' : styles.collapseIconRotated}`}
            />
            {isCollapsed ? (
                <UnfoldHorizontal
                    className={`${styles.collapseIcon} ${styles.collapseIconDesktop}`}
                />
            ) : (
                <FoldHorizontal
                    className={`${styles.collapseIcon} ${styles.collapseIconDesktop}`}
                />
            )}
        </>
    );
}

export default function Panel({
    panelId,
    title,
    icon: Icon,
    titleExtra,
    collapseEdge = 'center',
    headerActions,
    footer,
    variant = 'default',
    bodyClassName,
    className = '',
    children,
    onDragOver,
    onDragLeave,
    onDrop,
}) {
    const { isCollapsed, toggleCollapse } = usePanelGroup(panelId);

    const handleHeaderClick = () => {
        if (isCollapsed) toggleCollapse();
    };

    const handleToggleClick = (event) => {
        event.stopPropagation();
        toggleCollapse();
    };

    const panelClassName = [
        styles.panel,
        variant === 'output' ? styles.panelOutput : '',
        isCollapsed ? styles.panelCollapsed : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={panelClassName}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div
                className={`${styles.panelHeader} ${isCollapsed ? styles.panelHeaderCollapsed : ''}`}
                onClick={isCollapsed ? handleHeaderClick : undefined}
                role={isCollapsed ? 'button' : undefined}
                tabIndex={isCollapsed ? 0 : undefined}
                onKeyDown={
                    isCollapsed
                        ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleCollapse();
                              }
                          }
                        : undefined
                }
            >
                <div className={styles.panelTitle}>
                    {Icon && <Icon className={styles.panelIcon} />}
                    <span className={styles.panelTitleText}>{title}</span>
                    {!isCollapsed && titleExtra}
                </div>
                <div className={styles.headerActions}>
                    {!isCollapsed && headerActions}
                    <Tooltip content={isCollapsed ? 'Expand panel' : 'Collapse panel'}>
                        <button
                            type="button"
                            onClick={handleToggleClick}
                            className={styles.collapseButton}
                            aria-expanded={!isCollapsed}
                            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                        >
                            <CollapseToggleIcon
                                collapseEdge={collapseEdge}
                                isCollapsed={isCollapsed}
                            />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    <div className={[styles.body, bodyClassName].filter(Boolean).join(' ')}>
                        {children}
                    </div>
                    {footer && <div className={styles.footer}>{footer}</div>}
                </>
            )}
        </div>
    );
}
