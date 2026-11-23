const COLLAPSED_WIDTH_PX = 44;
const HANDLE_WIDTH_PX = 5;
const MIN_PANEL_WIDTH_PX = 180;

function formatGridTemplate(widths) {
    const parts = [];
    for (let index = 0; index < widths.length; index += 1) {
        parts.push(`${Math.round(widths[index])}px`);
        if (index < widths.length - 1) {
            parts.push(`${HANDLE_WIDTH_PX}px`);
        }
    }
    return parts.join(' ');
}

/**
 * Computes CSS grid-template-columns string and pixel panel widths for the current container width.
 */
export function buildGridTemplate(containerWidth, columns, collapsedPanels, panelWidths) {
    const panelCount = columns.length;
    const handlesWidth = Math.max(0, panelCount - 1) * HANDLE_WIDTH_PX;
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

    const expandedWidth = expandedIndices.reduce((sum, index) => sum + widths[index], 0);
    const collapsedWidth = widths.reduce(
        (sum, width, index) => (collapsedPanels[columns[index]] ? sum + width : sum),
        0,
    );
    const targetExpandedWidth = available - collapsedWidth;

    // Shrink expanded panels proportionally when the container narrows below their current sum.
    if (expandedIndices.length > 0 && expandedWidth > targetExpandedWidth) {
        const scale = targetExpandedWidth / expandedWidth;
        for (const index of expandedIndices) {
            widths[index] = Math.max(MIN_PANEL_WIDTH_PX, widths[index] * scale);
        }
    }

    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    if (totalWidth < available && expandedIndices.length > 0) {
        const lastExpanded = expandedIndices[expandedIndices.length - 1];
        widths[lastExpanded] += available - totalWidth;
    }

    return {
        template: formatGridTemplate(widths),
        widths,
    };
}

function findNearestExpandedIndex(columns, collapsedPanels, startIndex, step) {
    for (let index = startIndex; index >= 0 && index < columns.length; index += step) {
        if (!collapsedPanels[columns[index]]) {
            return index;
        }
    }
    return -1;
}

/**
 * Resolves which panel(s) a drag handle resizes, accounting for collapsed adjacent panels.
 */
export function getResizeTargets(handleIndex, columns, collapsedPanels) {
    const leftIndex = handleIndex;
    const rightIndex = handleIndex + 1;
    const leftCollapsed = collapsedPanels[columns[leftIndex]];
    const rightCollapsed = collapsedPanels[columns[rightIndex]];

    if (leftCollapsed && rightCollapsed) {
        return null;
    }

    if (!leftCollapsed && !rightCollapsed) {
        return { mode: 'pair', leftIndex, rightIndex };
    }

    if (leftCollapsed) {
        const expandedLeft = findNearestExpandedIndex(columns, collapsedPanels, leftIndex - 1, -1);
        if (expandedLeft >= 0) {
            return { mode: 'pair', leftIndex: expandedLeft, rightIndex };
        }
        return { mode: 'single', index: rightIndex, sign: -1 };
    }

    const expandedRight = findNearestExpandedIndex(columns, collapsedPanels, rightIndex + 1, 1);
    if (expandedRight >= 0) {
        return { mode: 'pair', leftIndex, rightIndex: expandedRight };
    }
    return { mode: 'single', index: leftIndex, sign: 1 };
}

/**
 * Computes `[index, width]` updates for a pointer drag delta, or `null` if clamped below minimum width.
 */
export function computeResizeUpdates(resizeTargets, startWidths, delta) {
    if (!resizeTargets) {
        return null;
    }

    if (resizeTargets.mode === 'single') {
        const nextWidth = startWidths[resizeTargets.index] + resizeTargets.sign * delta;
        if (nextWidth < MIN_PANEL_WIDTH_PX) {
            return null;
        }
        return [[resizeTargets.index, nextWidth]];
    }

    const nextLeft = startWidths[resizeTargets.leftIndex] + delta;
    const nextRight = startWidths[resizeTargets.rightIndex] - delta;

    if (nextLeft < MIN_PANEL_WIDTH_PX || nextRight < MIN_PANEL_WIDTH_PX) {
        return null;
    }

    return [
        [resizeTargets.leftIndex, nextLeft],
        [resizeTargets.rightIndex, nextRight],
    ];
}
