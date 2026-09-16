import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives a "stack" of full-viewport slides that all live inside one
 * pinned (sticky) viewport, one after another — the single mechanism
 * behind every "next thing covers the previous thing" transition on
 * the site, whether that cover slides in vertically or horizontally.
 *
 * The stack as a whole occupies `slides.length` steps of scroll (one
 * 100dvh step per slide). Slide 0 is the base of the stack and never
 * moves. Every slide after it starts fully off-screen — in the
 * direction given by its own `axis` — and animates to translate(0)
 * over its own dedicated step of scroll, then stays there, covering
 * whatever came before it. Keep scrolling and the next slide does the
 * same thing on top of it.
 *
 * slides: [{ id, navId, axis: 'vertical' | 'horizontal' }, ...]
 *   - id: unique key / DOM id for this slide
 *   - navId: which top-level nav entry this slide belongs to (several
 *     slides — e.g. every blog post — can share one navId)
 *   - axis: which edge this slide enters from. Slide 0's axis is
 *     never used (it doesn't move).
 */
// How long to wait, after the last scroll event, before treating the
// user as "stopped" and considering a snap-back.
const SNAP_IDLE_MS = 140;
// If the current position is already within this fraction of a slide
// step from a boundary, leave it alone — only correct real drift.
const SNAP_EPSILON = 0.06;
// How long a programmatic snap scroll is assumed to take, so the
// scroll events it generates don't get treated as fresh user scrolling.
const SNAP_SETTLE_MS = 500;
// How far into a slide's own scroll segment it needs to be before
// that slide counts as "entered" — see SlideEnteredContext. Higher
// than the >0 used for `activeIdx` so content inside a slide (title,
// participants list, ...) doesn't fire while it's still mid-cover.
const ENTER_THRESHOLD = 0.1;

export function useStackScroll(slides, { onActiveChange } = {}) {
    const stageRef = useRef(null);
    const slideRefs = useRef([]);
    const lastNavId = useRef(undefined);
    const lastEnteredId = useRef(null);
    const [enteredId, setEnteredId] = useState(null);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || slides.length === 0) return;

        const segments = Math.max(1, slides.length - 1);
        let raf = 0;
        let settleTimer = 0;
        let snapping = false;

        function getProgress() {
            const rect = stage.getBoundingClientRect();
            const vh = window.innerHeight;
            const scrollable = rect.height - vh;
            const progress =
                scrollable > 0
                    ? Math.min(1, Math.max(0, -rect.top / scrollable))
                    : 0;
            return { rect, scrollable, progress };
        }

        function update() {
            raf = 0;
            const { rect, progress } = getProgress();
            const vh = window.innerHeight;
            const vw = window.innerWidth;

            let activeIdx = 0;
            let settledIdx = 0;
            slideRefs.current.forEach((el, i) => {
                if (!el || i === 0) return;
                const segProgress = Math.min(
                    1,
                    Math.max(0, progress * segments - (i - 1)),
                );
                if (segProgress > 0) activeIdx = i;
                if (segProgress >= ENTER_THRESHOLD) settledIdx = i;
                const offset = 1 - segProgress;
                const axis = slides[i].axis;
                el.style.transform =
                    axis === "horizontal"
                        ? `translate3d(${offset * vw}px, 0, 0)`
                        : `translate3d(0, ${offset * vh}px, 0)`;
            });

            // A slide only "counts" for nav purposes once the stack has
            // actually started taking over the screen — same idea as the
            // old 0.45-viewport-height trigger used for section detection.
            const engaged = rect.top <= vh * 0.45;
            const navId = engaged ? (slides[activeIdx]?.navId ?? null) : null;
            if (navId !== lastNavId.current) {
                lastNavId.current = navId;
                onActiveChange?.(navId);
            }

            // Which single slide currently counts as "entered" — the
            // topmost one that has settled past ENTER_THRESHOLD. One
            // shared value for the whole slide (see SlideEnteredContext),
            // rather than each piece of content inside it watching for
            // itself.
            const nextEnteredId = engaged
                ? (slides[settledIdx]?.id ?? null)
                : null;
            if (nextEnteredId !== lastEnteredId.current) {
                lastEnteredId.current = nextEnteredId;
                setEnteredId(nextEnteredId);
            }
        }

        // If scrolling has come to rest mid-way between two slides, ease
        // the rest of the way to whichever one is closer — so the stack
        // always settles on a slide, never half-covered. Skipped at the
        // very ends (progress 0 or 1): those are already at rest, one
        // scroll away from Landing / the next section, and don't need a
        // push.
        function trySnap() {
            if (snapping) return;
            const { rect, scrollable, progress } = getProgress();
            if (scrollable <= 0 || progress <= 0 || progress >= 1) return;

            const step = progress * segments;
            const nearest = Math.round(step);
            if (Math.abs(step - nearest) < SNAP_EPSILON) return;

            const vh = window.innerHeight;
            const docTop = rect.top + window.scrollY;
            const targetY = docTop + (nearest / segments) * scrollable;

            snapping = true;
            window.scrollTo({ top: targetY, behavior: "smooth" });
            setTimeout(() => {
                snapping = false;
            }, SNAP_SETTLE_MS);
        }

        function scheduleSnap() {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(trySnap, SNAP_IDLE_MS);
        }

        function onScroll() {
            if (!raf) raf = requestAnimationFrame(update);
            scheduleSnap();
        }

        function onResize() {
            if (!raf) raf = requestAnimationFrame(update);
        }

        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            clearTimeout(settleTimer);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
        };
        // slides is rebuilt (new array) only when the underlying content
        // actually changes (e.g. posts load), so it's a safe effect dep.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slides]);

    // Scrolls so that the *first* slide belonging to `navId` finishes its
    // entrance and settles in place — used by the nav bar's click handler.
    // Slides are absolutely positioned inside a sticky viewport, so a
    // plain scrollIntoView on them doesn't work; we compute the document
    // scroll position that corresponds to that slide's settle point.
    const scrollToId = useCallback(
        (navId) => {
            const stage = stageRef.current;
            if (!stage) return;
            const slideList = slides;
            const index = slideList.findIndex((s) => s.navId === navId);
            if (index === -1) return;

            const segments = Math.max(1, slideList.length - 1);
            const vh = window.innerHeight;
            const docTop = stage.getBoundingClientRect().top + window.scrollY;
            const stageHeight = stage.offsetHeight;
            const targetProgress = index / segments;
            const targetY = docTop + targetProgress * (stageHeight - vh);

            window.scrollTo({ top: targetY, behavior: "smooth" });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [slides],
    );

    return { stageRef, slideRefs, scrollToId, enteredId };
}
