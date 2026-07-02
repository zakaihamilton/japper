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

const COLLAPSED_WIDTH_PX = 44;
const HANDLE_WIDTH_PX = 5;
const MIN_PANEL_WIDTH_PX = 180;
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

function buildGridTemplate(containerWidth, columns, collapsedPanels, panelWidths) {
    const panelCount = columns.length;
    const handlesWidth = (panelCount - 1) * HANDLE_WIDTH_PX;
    const available = containerWidth - handlesWidth;

    const widths = columns.map((id, index) => {
        if (collapsedPanels[id]) {
            return COLLAPSED_WIDTH_PX;
        }

        return panelWidths[index] ?? null;
    });

    const expandedIndices = columns
        .map((id, index) => (!collapsedPanels[id] ? index : -1))
        .filter((index) => index >= 0);

    const fixedWidth = widths.reduce((sum, width) => sum + (width ?? 0), 0);
    const autoIndices = expandedIndices.filter((index) => widths[index] === null);

    if (autoIndices.length > 0) {
        const autoBudget = available - fixedWidth;
        const share = autoBudget / autoIndices.length;
        for (const index of autoIndices) {
            widths[index] = Math.max(MIN_PANEL_WIDTH_PX, share);
        }
    }

    let expandedWidth = expandedIndices.reduce((sum, index) => sum + widths[index], 0);
    const collapsedWidth = widths.reduce(
        (sum, width, index) => (collapsedPanels[columns[index]] ? sum + width : sum),
        0,
    );
    const targetExpandedWidth = available - collapsedWidth;

    if (expandedWidth > targetExpandedWidth) {
        const scale = targetExpandedWidth / expandedWidth;
        for (const index of expandedIndices) {
            widths[index] = Math.max(MIN_PANEL_WIDTH_PX, widths[index] * scale);
        }
        expandedWidth = expandedIndices.reduce((sum, index) => sum + widths[index], 0);
    }

    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    if (totalWidth < available && expandedIndices.length > 0) {
        const lastExpanded = expandedIndices[expandedIndices.length - 1];
        widths[lastExpanded] += available - totalWidth;
    }

    const parts = [];
    for (let index = 0; index < panelCount; index += 1) {
        parts.push(`${Math.round(widths[index])}px`);
        if (index < panelCount - 1) {
            parts.push(`${HANDLE_WIDTH_PX}px`);
        }
    }

    return {
        template: parts.join(' '),
        widths,
    };
}

function ResizeHandle({ disabled, isActive, onPointerDown }) {
    return (
        <div
            className={[
                styles.resizeHandle,
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

            const leftIndex = dragState.handleIndex;
            const rightIndex = dragState.handleIndex + 1;
            const leftId = columns[leftIndex];
            const rightId = columns[rightIndex];

            if (collapsedPanels[leftId] || collapsedPanels[rightId]) {
                return;
            }

            const delta = event.clientX - dragState.startX;
            const nextLeft = dragState.startWidths[leftIndex] + delta;
            const nextRight = dragState.startWidths[rightIndex] - delta;

            if (nextLeft < MIN_PANEL_WIDTH_PX || nextRight < MIN_PANEL_WIDTH_PX) {
                return;
            }

            setPanelWidths((prev) => {
                const next = [...prev];
                next[leftIndex] = nextLeft;
                next[rightIndex] = nextRight;
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
            if (collapsedPanels[leftId] || collapsedPanels[rightId]) {
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
            const disabled = collapsedPanels[leftId] || collapsedPanels[rightId];

            items.push(
                <ResizeHandle
                    key={`resize-handle-${columns[index]}-${columns[index + 1]}`}
                    disabled={disabled}
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
