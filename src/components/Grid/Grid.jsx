import { useEffect, useRef } from "react";
import "./Grid.css";
import {
    computeGridMetrics,
    publishGridCssVars,
    makeGridCells,
} from "../../utils/grid.js";
import { createLoadingScene, drawLoadingScene } from "./loadingScene.js";
import {
    loadImage,
    buildLoadedLayers,
    buildIdleCanvas,
    drawLoadedScene,
    pickLayerGroup,
} from "./loadedScene.js";
import { now, easeOutCubic } from "./mathUtils.js";

const CELL_SIZE = 72;

const MIN_LOADING_MS = 2000;
const TRANSITION_MS = 900;

export default function Grid({
    artwork,
    opacity = 1,
    enabled = true,
    onLoaded,
}) {
    const canvasRef = useRef(null);
    const mountedAtRef = useRef(now());
    const enabledRef = useRef(enabled);
    const requestStaticDrawRef = useRef(() => {});
    const stateRef = useRef({
        width: 0,
        height: 0,
        cells: [],
        pointer: null,
        frame: null,
        phase: "loading", // "loading" | "transitioning" | "loaded"
        loadingScene: null,
        loadedLayers: null,
        transitionStart: 0,
    });

    // Kept in sync with the `enabled` prop so the pointer handlers (set up
    // once below, independent of prop changes) can cheaply check current
    // enabled-ness without re-subscribing. When the canvas flips back on
    // (e.g. scrolling back up out of the Mission section) we also force one
    // redraw so it immediately reflects wherever the cursor actually is,
    // rather than showing a stale frame from before it was disabled.
    useEffect(() => {
        enabledRef.current = enabled;
        if (enabled) requestStaticDrawRef.current();
    }, [enabled]);

    useEffect(() => {
        let cancelled = false;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: false });
        const state = stateRef.current;

        function layout() {
            resizeCanvas(canvas, ctx, state);
            state.cells = makeCells(state);
            state.loadingScene = createLoadingScene(state.cells.length);
        }

        function render() {
            if (state.phase === "loading") {
                drawLoadingScene(ctx, state);
                return;
            }

            if (state.phase === "transitioning") {
                const progress = Math.min(
                    1,
                    (now() - state.transitionStart) / TRANSITION_MS,
                );

                drawLoadingScene(ctx, state);
                drawLoadedScene(ctx, state, easeOutCubic(progress));

                if (progress >= 1) {
                    state.phase = "loaded";
                    onLoaded?.();
                }
                return;
            }

            drawLoadedScene(ctx, state);
        }

        function loop() {
            render();
            state.frame =
                state.phase === "loaded" ? null : requestAnimationFrame(loop);
        }

        function startLoop() {
            if (!state.frame) state.frame = requestAnimationFrame(loop);
        }

        function requestStaticDraw() {
            if (state.phase !== "loaded" || state.frame) return;
            state.frame = requestAnimationFrame(() => {
                state.frame = null;
                render();
            });
        }

        async function load() {
            state.phase = "loading";
            layout();
            startLoop();

            if (!artwork || !artwork.imageUrl) return;

            const image = await loadImage(artwork.imageUrl);
            if (cancelled) return;

            state.loadedLayers = buildLoadedLayers(
                image,
                artwork,
                state.width,
                state.height,
            );
            state.loadedLayers.idle = buildIdleCanvas(
                state.loadedLayers,
                state,
            );

            const remaining = Math.max(
                0,
                MIN_LOADING_MS - (now() - mountedAtRef.current),
            );
            state.minWaitTimer = setTimeout(() => {
                if (cancelled) return;
                state.transitionStart = now();
                state.phase = "transitioning";
                startLoop();
            }, remaining);
        }

        function onResize() {
            clearTimeout(state.resizeTimer);
            state.resizeTimer = setTimeout(async () => {
                const needsRebuild =
                    (state.phase === "loaded" ||
                        state.phase === "transitioning") &&
                    artwork?.imageUrl;
                layout();

                if (!needsRebuild) return;

                const image = await loadImage(artwork.imageUrl).catch(
                    () => null,
                );
                if (cancelled || !image) return;
                state.loadedLayers = buildLoadedLayers(
                    image,
                    artwork,
                    state.width,
                    state.height,
                );
                state.loadedLayers.idle = buildIdleCanvas(
                    state.loadedLayers,
                    state,
                );
                render();
            }, 120);
        }

        // Tracked at window/document level rather than on the canvas itself
        // — the canvas sits under floating UI (the News/Credits overlays,
        // and later the Mission content) that needs its own click/hover
        // handling, and a listener on the canvas element stops receiving
        // events the moment the pointer is over whatever's on top of it.
        // Reading clientX/clientY globally keeps the cursor coordinate
        // flowing no matter what's being hovered or clicked, so the canvas
        // interaction never appears to "freeze" under those elements.
        // `enabledRef` gates the actual redraw so this stays free once the
        // canvas has been scroll-disabled (see the enabled sync effect
        // above) instead of doing pointless work while it's not visible.
        function onPointerMove(event) {
            state.pointer = { x: event.clientX, y: event.clientY };
            if (!enabledRef.current) return;
            requestStaticDraw();
        }

        function onPointerLeave() {
            state.pointer = null;
            if (!enabledRef.current) return;
            requestStaticDraw();
        }

        requestStaticDrawRef.current = requestStaticDraw;

        load().catch((error) => {
            if (cancelled) return;
            state.phase = "loaded";
            onLoaded?.();
        });

        window.addEventListener("resize", onResize);
        window.addEventListener("pointermove", onPointerMove);
        // pointerleave doesn't bubble, but attached directly to `document`
        // it fires when the pointer leaves the browser viewport entirely —
        // exactly the "cursor left the page" case the canvas should treat
        // as no pointer at all.
        document.addEventListener("pointerleave", onPointerLeave);

        return () => {
            cancelled = true;
            requestStaticDrawRef.current = () => {};
            window.removeEventListener("resize", onResize);
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerleave", onPointerLeave);
            if (state.frame) {
                cancelAnimationFrame(state.frame);
                state.frame = null;
            }
            clearTimeout(state.resizeTimer);
            clearTimeout(state.minWaitTimer);
        };
    }, [artwork]);

    return (
        <canvas
            ref={canvasRef}
            className="grid-canvas"
            style={{
                opacity,
                transition: "opacity 0.15s linear",
                pointerEvents: enabled ? "auto" : "none",
                display: enabled ? "block" : "none",
            }}
            aria-hidden="true"
        />
    );
}

function resizeCanvas(canvas, ctx, state) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // const width = window.innerWidth;
    // const height = window.innerHeight;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    state.width = width;
    state.height = height;

    const { cellSize, rows, cols, offsetX } = computeGridMetrics(
        width,
        height,
        CELL_SIZE,
    );

    state.cellSize = cellSize;
    state.rows = rows;
    state.cols = cols;
    state.offsetX = offsetX;

    publishGridCssVars({ cellSize, offsetX });

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeCells(state) {
    const { width, height, cellSize, cols, rows, offsetX } = state;

    return makeGridCells(width, height, cellSize, offsetX, rows, cols).map(
        (cell) => ({
            ...cell,
            group: pickLayerGroup(cell.row, cell.col),
        }),
    );
}
