'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

function panelColWidth(collapsed) {
    return collapsed ? '2.75rem' : '1fr';
}

export default function PanelGroup({ columns, children, className }) {
    const [collapsedPanels, setCollapsedPanels] = useState(() =>
        Object.fromEntries(columns.map((id) => [id, false]))
    );

    const togglePanel = useCallback((id) => {
        setCollapsedPanels((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            const expandedCount = Object.values(next).filter((v) => !v).length;
            if (expandedCount === 0) return prev;
            return next;
        });
    }, []);

    const contextValue = useMemo(
        () => ({ collapsedPanels, togglePanel }),
        [collapsedPanels, togglePanel]
    );

    const layoutStyle = useMemo(() => ({
        gridTemplateColumns: columns
            .map((id) => panelColWidth(collapsedPanels[id]))
            .join(' '),
    }), [columns, collapsedPanels]);

    return (
        <PanelGroupContext.Provider value={contextValue}>
            <main className={className} style={layoutStyle}>
                {children}
            </main>
        </PanelGroupContext.Provider>
    );
}
