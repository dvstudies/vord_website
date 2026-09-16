import { useLayoutEffect, useMemo, useRef, useState } from "react";

// Marquee speed, in pixels of travel per second — kept constant across
// every LoopXButton instance so two labels of very different lengths
// (e.g. "News" and "Participants") still read as the same motion,
// instead of one crawling and the other racing.
const SPEED_PX_PER_SEC = 70;
// Safety cap on how many times the label gets duplicated, in case a
// measurement ever comes back unexpectedly tiny (e.g. empty text).
const MAX_REPEATS = 60;

/**
 * The site's `.loop-x` marquee — an endlessly looping horizontal
 * label, used as a visual shorthand for "this is clickable" (pass
 * `onClick`) or just "pay attention here" (omit it). Handles its own
 * duplication: give it `text` (and optionally a `separator`) and it
 * repeats "{text}{separator}" enough times to fill at least twice its
 * own width, then loops by exactly one measured repeat's pixel width.
 *
 * That measurement is what makes the loop seamless (no guessing at a
 * percentage that only happens to line up for some texts) and keeps
 * every instance moving at the same visual speed regardless of how
 * long its label is — see --loop-x-unit-width / --loop-x-duration in
 * global.css.
 */
export default function LoopXButton({
    text,
    separator = " // ",
    speed = SPEED_PX_PER_SEC,
    as: Tag = "h2",
    className = "",
    onClick,
    ...rest
}) {
    const containerRef = useRef(null);
    const unitRef = useRef(null);
    const [unitWidth, setUnitWidth] = useState(0);
    const [repeats, setRepeats] = useState(2);

    const unit = `${text}${separator}`;
    const clickable = typeof onClick === "function";

    useLayoutEffect(() => {
        const container = containerRef.current;
        const unitEl = unitRef.current;
        if (!container || !unitEl) return;

        function measure() {
            const uw = unitEl.getBoundingClientRect().width;
            const cw = container.getBoundingClientRect().width;
            if (uw <= 0) return;
            setUnitWidth(uw);
            setRepeats(
                Math.min(
                    MAX_REPEATS,
                    Math.max(2, Math.ceil((cw * 2) / uw) + 1),
                ),
            );
        }

        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(container);
        ro.observe(unitEl);
        return () => ro.disconnect();
    }, [text, separator]);

    const duration = unitWidth > 0 ? unitWidth / speed : 0;
    const items = useMemo(() => Array.from({ length: repeats }), [repeats]);

    function handleKeyDown(e) {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e);
        }
    }

    return (
        <div
            ref={containerRef}
            className={`loop-x${clickable ? " clickable" : ""}${className ? ` ${className}` : ""}`}
            onClick={onClick}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? handleKeyDown : undefined}
            {...rest}
        >
            <Tag className="sr-only">{text}</Tag>

            <div
                className="loop-x-track"
                aria-hidden="true"
                style={{
                    "--loop-x-unit-width": `${unitWidth}px`,
                    "--loop-x-duration": `${duration}s`,
                }}
            >
                {items.map((_, i) => (
                    <Tag
                        key={i}
                        ref={i === 0 ? unitRef : undefined}
                        className="loop-x-unit"
                    >
                        {unit}
                    </Tag>
                ))}
            </div>
        </div>
    );
}
