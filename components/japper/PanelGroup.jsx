'use client';

import {
    Children,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import styles from './PanelGroup.module.css';
import { buildGridTemplate, computeResizeUpdates, getResizeTargets } from './panelGroupLayout';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

const PanelGroupContext = createContext(null);

export function usePanelGroup(panelId) {
    const context = useContext(PanelGroupContext);
    if (!context) {
        throw new Error('usePanelGroup must be used within a PanelGroup');
    }

    return {
        isCollapsed: context.collapsedPanels[panelId] ?? false,
        toggleCollapse: () => context.togglePanel(panelId),
    };
}

function ResizeHandle({ disabled, isActive, collapsedAdjacent, onPointerDown }) {
    return (
        <div
            className={[
                styles.resizeHandle,
                collapsedAdjacent ? styles.resizeHandleCollapsedAdjacent : '',
                isActive ? styles.resizeHandleActive : '',
                disabled ? styles.resizeHandleDisabled : '',
            ]
                .filter(Boolean)
                .join(' ')}
            onPointerDown={disabled ? undefined : onPointerDown}
        />
    );
}

export default function PanelGroup({ columns, children, className = '' }) {
    const containerRef = useRef(null);
    const dragStateRef = useRef(null);
    const [collapsedPanels, setCollapsedPanels] = useState(() =>
        Object.fromEntries(columns.map((id) => [id, false])),
    );
    const [panelWidths, setPanelWidths] = useState(() => columns.map(() => null));
    const [containerWidth, setContainerWidth] = useState(0);
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
    );
    const [activeHandle, setActiveHandle] = useState(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
        const update = () => setIsDesktop(mediaQuery.matches);
        update();
        mediaQuery.addEventListener('change', update);
        return () => mediaQuery.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) {
            return undefined;
        }

        const updateWidth = () => {
            setContainerWidth(element.getBoundingClientRect().width);
        };

        updateWidth();

        const observer = new ResizeObserver(() => {
            updateWidth();
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const togglePanel = useCallback((id) => {
        setCollapsedPanels((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            const expandedCount = Object.values(next).filter((value) => !value).length;
            if (expandedCount === 0) {
                return prev;
            }
            return next;
        });
    }, []);

    const contextValue = useMemo(
        () => ({ collapsedPanels, togglePanel }),
        [collapsedPanels, togglePanel],
    );

    const layout = useMemo(() => {
        if (!isDesktop || containerWidth <= 0) {
            return null;
        }

        return buildGridTemplate(containerWidth, columns, collapsedPanels, panelWidths);
    }, [isDesktop, containerWidth, columns, collapsedPanels, panelWidths]);

    const endDrag = useCallback(() => {
        dragStateRef.current = null;
        setActiveHandle(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const handlePointerMove = useCallback(
        (event) => {
            const dragState = dragStateRef.current;
            if (!dragState) {
                return;
            }

            const resizeTargets = getResizeTargets(dragState.handleIndex, columns, collapsedPanels);
            const updates = computeResizeUpdates(
                resizeTargets,
                dragState.startWidths,
                event.clientX - dragState.startX,
            );
            if (!updates) {
                return;
            }

            setPanelWidths((prev) => {
                const next = [...prev];
                for (const [index, width] of updates) {
                    next[index] = width;
                }
                return next;
            });
        },
        [collapsedPanels, columns],
    );

    const handlePointerUp = useCallback(() => {
        endDrag();
    }, [endDrag]);

    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [handlePointerMove, handlePointerUp]);

    const startDrag = useCallback(
        (handleIndex, event) => {
            if (!layout) {
                return;
            }

            const leftId = columns[handleIndex];
            const rightId = columns[handleIndex + 1];
            if (collapsedPanels[leftId] && collapsedPanels[rightId]) {
                return;
            }

            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);

            dragStateRef.current = {
                handleIndex,
                startX: event.clientX,
                startWidths: layout.widths,
            };
            setActiveHandle(handleIndex);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [layout, columns, collapsedPanels],
    );

    const layoutStyle = useMemo(() => {
        if (!isDesktop || !layout) {
            return undefined;
        }

        return { gridTemplateColumns: layout.template };
    }, [isDesktop, layout]);

    const childArray = Children.toArray(children);
    const items = [];

    childArray.forEach((child, index) => {
        items.push(child);

        if (index < childArray.length - 1) {
            const leftId = columns[index];
            const rightId = columns[index + 1];
            const disabled = collapsedPanels[leftId] && collapsedPanels[rightId];
            const collapsedAdjacent = collapsedPanels[leftId] || collapsedPanels[rightId];

            items.push(
                <ResizeHandle
                    key={`resize-handle-${columns[index]}-${columns[index + 1]}`}
                    disabled={disabled}
                    collapsedAdjacent={collapsedAdjacent}
                    isActive={activeHandle === index}
                    onPointerDown={(event) => startDrag(index, event)}
                />,
            );
        }
    });

    return (
        <PanelGroupContext.Provider value={contextValue}>
            <main
                ref={containerRef}
                className={`${styles.panelGroup} ${className}`}
                style={layoutStyle}
            >
                {items}
            </main>
        </PanelGroupContext.Provider>
    );
}
