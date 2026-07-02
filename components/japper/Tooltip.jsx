'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

const VIEWPORT_PADDING = 8;
const TOOLTIP_OFFSET = 6;

function clampPosition(triggerRect, tooltipRect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
    let placement = 'top';

    if (top < VIEWPORT_PADDING) {
        top = triggerRect.bottom + TOOLTIP_OFFSET;
        placement = 'bottom';
    }

    if (top + tooltipRect.height > viewportHeight - VIEWPORT_PADDING) {
        top = Math.max(
            VIEWPORT_PADDING,
            Math.min(
                triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET,
                viewportHeight - tooltipRect.height - VIEWPORT_PADDING,
            ),
        );
        placement = 'top';
    }

    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(
        VIEWPORT_PADDING,
        Math.min(left, viewportWidth - tooltipRect.width - VIEWPORT_PADDING),
    );

    return { top, left, placement };
}

export default function Tooltip({ content, children }) {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        const tooltip = tooltipRef.current;
        if (!trigger || !tooltip) return;

        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        setPosition(clampPosition(triggerRect, tooltipRect));
    }, []);

    const show = useCallback(() => {
        setVisible(true);
    }, []);

    const hide = useCallback(() => {
        setVisible(false);
    }, []);

    useLayoutEffect(() => {
        if (!visible) return;
        updatePosition();
    }, [visible, updatePosition]);

    useEffect(() => {
        if (!visible) return;

        const handleReposition = () => updatePosition();
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);

        return () => {
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [visible, updatePosition]);

    if (!content) {
        return children;
    }

    return (
        <>
            <span
                ref={triggerRef}
                className={styles.trigger}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
            >
                {children}
            </span>
            {visible &&
                createPortal(
                    <span
                        ref={tooltipRef}
                        role="tooltip"
                        className={styles.tooltip}
                        style={{ top: position.top, left: position.left }}
                    >
                        {content}
                    </span>,
                    document.body,
                )}
        </>
    );
}
