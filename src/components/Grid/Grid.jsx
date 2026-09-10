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
    drawLoadedScene,
    pickLayerGroup,
} from "./loadedScene.js";
import { now, easeOutCubic } from "./mathUtils.js";

const CELL_SIZE = 72;

// The loading state always stays up at least this long, even if the
// artwork/image pipeline behind it finishes sooner — long enough to read
// as an intentional loading beat rather than a flicker.
const MIN_LOADING_MS = 2000;

// How long the crossfade from the loading grid to the loaded artwork
// takes, once it starts.
const TRANSITION_MS = 900;

export default function Grid({ artwork, opacity = 1, onLoaded }) {
    const canvasRef = useRef(null);
    const mountedAtRef = useRef(now());
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
                // The loading grid stays as the base coat; the artwork
                // crossfades in on top of it rather than cutting in.
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

        // While loading (and during the crossfade into the loaded scene),
        // the grid animates on its own regardless of pointer input, so it
        // needs a continuous loop. Once fully loaded, rendering only
        // changes in response to pointer events, so the loop stops
        // itself to save cycles.
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

            // Artwork hasn't arrived yet (e.g. the daily-artwork fetch is
            // still in flight) — keep showing the loading fx and wait for
            // the effect to rerun once it does.
            if (!artwork || !artwork.imageUrl) return;

            const image = await loadImage(artwork.imageUrl);
            if (cancelled) return;

            state.loadedLayers = buildLoadedLayers(
                image,
                artwork,
                state.width,
                state.height,
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
                    (state.phase === "loaded" || state.phase === "transitioning") &&
                    artwork?.imageUrl;
                layout();

                if (!needsRebuild) return;

                const image = await loadImage(artwork.imageUrl).catch(() => null);
                if (cancelled || !image) return;
                state.loadedLayers = buildLoadedLayers(
                    image,
                    artwork,
                    state.width,
                    state.height,
                );
                render();
            }, 120);
        }

        function onPointerMove(event) {
            state.pointer = { x: event.clientX, y: event.clientY };
            requestStaticDraw();
        }

        function onPointerLeave() {
            state.pointer = null;
            requestStaticDraw();
        }

        load().catch((error) => {
            console.error("Grid load failed:", error);
            if (cancelled) return;
            state.phase = "loaded";
            onLoaded?.();
        });

        window.addEventListener("resize", onResize);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);

        return () => {
            cancelled = true;
            window.removeEventListener("resize", onResize);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerleave", onPointerLeave);
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
            style={{ opacity, transition: "opacity 0.15s linear" }}
            aria-hidden="true"
        />
    );
}

function resizeCanvas(canvas, ctx, state) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    state.width = width;
    state.height = height;

    // Shared metrics — the CSS background grids consume the same numbers
    // (via the CSS vars published below) so every grid on the site matches.
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
