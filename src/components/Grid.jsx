import { useEffect, useRef } from "react";
import "./Grid.css";

const GRID = {
    cellSize: 72,
    interactionRadius: 300,
    idleBlur: 10,
    minOpacity: 0.12,
    gridLine: "rgba(0, 0, 0, 0.22)",
    background: "#f5f5f5",
};

export default function Grid({ artwork, opacity = 1 }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({
        dpr: 1,
        width: 0,
        height: 0,
        cells: [],
        layers: null,
        pointer: null,
        frame: null,
    });

    useEffect(() => {
        let cancelled = false;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: false });
        const state = stateRef.current;

        async function setup() {
            state.layers = null;
            resizeCanvas(canvas, ctx, state);
            state.cells = makeCells(state.width, state.height, GRID.cellSize);

            const image = await loadImage(artwork.imageUrl);
            if (cancelled) return;

            const source = makeSourceCanvas(image, state.width, state.height);
            const edges = makeEdgeCanvas(source);
            const text = makeTextCanvas(artwork, state.width, state.height);

            state.layers = { source, edges, text };
            drawScene(ctx, state);
        }

        function onResize() {
            clearTimeout(state.resizeTimer);
            state.resizeTimer = setTimeout(setup, 120);
        }

        function onPointerMove(event) {
            state.pointer = { x: event.clientX, y: event.clientY };
            requestDraw(ctx, state);
        }

        function onPointerLeave() {
            state.pointer = null;
            requestDraw(ctx, state);
        }

        setup();
        window.addEventListener("resize", onResize);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);

        return () => {
            cancelled = true;
            window.removeEventListener("resize", onResize);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerleave", onPointerLeave);
            if (state.frame) cancelAnimationFrame(state.frame);
            clearTimeout(state.resizeTimer);
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

function requestDraw(ctx, state) {
    if (state.frame) return;

    state.frame = requestAnimationFrame(() => {
        state.frame = null;
        drawScene(ctx, state);
    });
}

function resizeCanvas(canvas, ctx, state) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    state.dpr = dpr;
    state.width = width;
    state.height = height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeCells(width, height, cellSize) {
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const x = col * cellSize;
            const y = row * cellSize;
            const w = Math.min(cellSize, width - x);
            const h = Math.min(cellSize, height - y);

            cells.push({
                x,
                y,
                w,
                h,
                cx: x + w / 2,
                cy: y + h / 2,
                group: seededGroup(row, col),
            });
        }
    }

    return cells;
}

function seededGroup(row, col) {
    const value = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
    return Math.floor((value - Math.floor(value)) * 3);
}

function drawScene(ctx, state) {
    const { width, height, cells, layers, pointer } = state;
    if (!layers) {
        ctx.fillStyle = GRID.background;
        ctx.fillRect(0, 0, width, height);
        return;
    }

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    ctx.fillStyle = GRID.background;
    ctx.fillRect(0, 0, width, height);

    for (const cell of cells) {
        drawCell(ctx, cell, layers, pointer);
    }

    drawGridLines(ctx, width, height, GRID.cellSize);
    ctx.restore();
}

function drawCell(ctx, cell, layers, pointer) {
    const proximity = pointer ? getProximity(pointer, cell) : 0;
    const eased = easeOutCubic(proximity);
    const blur = lerp(GRID.idleBlur, 0, eased);
    const opacity = lerp(GRID.minOpacity, 1, eased);
    const layer =
        cell.group === 0
            ? layers.source
            : cell.group === 1
              ? layers.edges
              : layers.text;
    const pad = Math.ceil(blur * 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();

    ctx.globalAlpha = opacity;
    ctx.filter = `blur(${blur}px) saturate(${lerp(0.82, 1, eased)}) contrast(${lerp(0.9, 1, eased)})`;

    ctx.drawImage(
        layer,
        Math.max(0, cell.x - pad),
        Math.max(0, cell.y - pad),
        Math.min(cell.w + pad * 2, layer.width - cell.x + pad),
        Math.min(cell.h + pad * 2, layer.height - cell.y + pad),
        cell.x - pad,
        cell.y - pad,
        cell.w + pad * 2,
        cell.h + pad * 2,
    );

    ctx.restore();
}

function drawGridLines(ctx, width, height, cellSize) {
    ctx.save();
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = GRID.gridLine;
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
    }

    for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
    }

    ctx.restore();
}

function getProximity(pointer, cell) {
    const dx = pointer.x - cell.cx;
    const dy = pointer.y - cell.cy;
    const distance = Math.hypot(dx, dy);
    return clamp(1 - distance / GRID.interactionRadius, 0, 1);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () =>
            reject(new Error(`Could not load artwork image: ${src}`));
        img.src = src;
    });
}

function makeSourceCanvas(image, width, height) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const canvasRatio = width / height;
    const imageRatio = image.naturalWidth / image.naturalHeight;

    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;

    if (imageRatio > canvasRatio) {
        sw = image.naturalHeight * canvasRatio;
        sx = (image.naturalWidth - sw) / 2;
    } else {
        sh = image.naturalWidth / canvasRatio;
        sy = (image.naturalHeight - sh) / 2;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

    return canvas;
}

function makeEdgeCanvas(source) {
    const width = source.width;
    const height = source.height;
    const edgeCanvas = document.createElement("canvas");
    const srcCtx = source.getContext("2d", { willReadFrequently: true });
    const edgeCtx = edgeCanvas.getContext("2d", { willReadFrequently: true });
    const src = srcCtx.getImageData(0, 0, width, height);
    const out = edgeCtx.createImageData(width, height);
    const gray = new Uint8ClampedArray(width * height);

    edgeCanvas.width = width;
    edgeCanvas.height = height;

    for (let i = 0, p = 0; i < src.data.length; i += 4, p += 1) {
        gray[p] =
            src.data[i] * 0.299 +
            src.data[i + 1] * 0.587 +
            src.data[i + 2] * 0.114;
    }

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const i = y * width + x;
            const gx =
                -gray[i - width - 1] +
                gray[i - width + 1] -
                2 * gray[i - 1] +
                2 * gray[i + 1] -
                gray[i + width - 1] +
                gray[i + width + 1];
            const gy =
                -gray[i - width - 1] -
                2 * gray[i - width] -
                gray[i - width + 1] +
                gray[i + width - 1] +
                2 * gray[i + width] +
                gray[i + width + 1];
            const edge = Math.min(255, Math.hypot(gx, gy));
            const inverted = 255 - edge;
            const o = i * 4;

            out.data[o] = inverted;
            out.data[o + 1] = inverted;
            out.data[o + 2] = inverted;
            out.data[o + 3] = 255;
        }
    }

    edgeCtx.putImageData(out, 0, 0);
    return edgeCanvas;
}

function makeTextCanvas(artwork, width, height) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const columns = Math.max(2, Math.floor(width / 260));
    const gutter = 36;
    const margin = 34;
    const columnWidth = (width - margin * 2 - gutter * (columns - 1)) / columns;
    const text = buildText(artwork);
    const words = text.split(/\s+/);
    const lineHeight = 21;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = GRID.background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.font = "15px Georgia, 'Times New Roman', serif";
    ctx.textBaseline = "top";

    let wordIndex = 0;

    for (let col = 0; col < columns; col += 1) {
        let x = margin + col * (columnWidth + gutter);
        let y = margin;

        while (y < height - margin) {
            let line = "";

            while (wordIndex < words.length) {
                const test = line
                    ? `${line} ${words[wordIndex]}`
                    : words[wordIndex];
                if (ctx.measureText(test).width > columnWidth) break;
                line = test;
                wordIndex += 1;
            }

            if (!line) {
                wordIndex += 1;
                continue;
            }

            ctx.fillText(line, x, y);
            y += lineHeight;

            if (wordIndex >= words.length) wordIndex = 0;
        }
    }

    return canvas;
}

function buildText(artwork) {
    const title = artwork.title || "Untitled";
    const artist = artwork.artist || "Unknown artist";
    const year = artwork.year ? ` (${artwork.year})` : "";
    const description = artwork.description || "No description available.";
    const source = artwork.source || "Archive source";

    return Array.from(
        { length: 24 },
        () =>
            `${title}. ${artist}${year}. ${description} This image is treated as archival material, visual surface, edge map, and textual record. Source: ${source}.`,
    ).join(" ");
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
