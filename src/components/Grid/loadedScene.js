// Loaded-state canvas rendering: draws the fetched artwork as three
// interleaved per-cell layers (source image, edge map, generated text),
// sharpening whichever cell is near the pointer and blurring the rest.
import { drawGridLines } from "../../utils/grid.js";
import { getProximity, lerp, easeOutCubic } from "./mathUtils.js";

const BACKGROUND = "#f5f5f5";
const IDLE_BLUR = 10;
const MIN_OPACITY = 0.12;
const INTERACTION_RADIUS = 300;

// Deterministic-but-varied assignment of each cell to one of the three
// layers (source / edges / text) — stable across a given (row, col) so a
// cell doesn't jump layers between renders.
export function pickLayerGroup(row, col) {
    const value = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
    return Math.floor((value - Math.floor(value)) * 3);
}

export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () =>
            reject(new Error(`Could not load artwork image: ${src}`));
        img.src = src;
    });
}

export function buildLoadedLayers(image, artwork, width, height) {
    const source = makeSourceCanvas(image, width, height);
    const edges = makeEdgeCanvas(source);
    const text = makeTextCanvas(artwork, width, height);
    return { source, edges, text, idle: null };
}

// Bakes the fully-idle (no pointer nearby) rendering of every cell into an
// offscreen canvas once per layout/resize/artwork change. A normal frame
// can then blit this single image instead of re-running the (expensive)
// per-cell blur filter for cells that are nowhere near the cursor and
// therefore look identical frame to frame. Call this once right after
// buildLoadedLayers (and again after any resize-triggered rebuild) and
// stash the result as `loadedLayers.idle` — see Grid.jsx.
export function buildIdleCanvas(layers, state) {
    const { width, height, cells } = state;
    const idle = document.createElement("canvas");
    idle.width = width;
    idle.height = height;
    const ctx = idle.getContext("2d");

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    for (const cell of cells) {
        drawCellIdle(ctx, cell, layers);
    }

    return idle;
}

// `fade` (0..1) lets a caller crossfade this scene in over whatever is
// already on the canvas — e.g. Grid.jsx fading the loaded artwork in over
// the loading scene instead of cutting to it instantly. Defaults to fully
// opaque for normal (post-transition) rendering.
export function drawLoadedScene(ctx, state, fade = 1) {
    const { width, height, cells, loadedLayers, pointer } = state;

    ctx.save();
    ctx.filter = "none";

    if (loadedLayers && fade >= 1 && loadedLayers.idle) {
        // Steady state (no crossfade in progress): blit the pre-baked idle
        // rendering — one cheap drawImage, no filter — then only re-run the
        // blur filter for cells actually within range of the pointer. This
        // is the hot path during normal interaction, and it's what keeps
        // the blur/unblur responsive: previously every cell on screen paid
        // for its own canvas blur filter on every single pointer move,
        // which is the expensive operation, so a full grid redraw could
        // easily miss a frame and visibly lag behind the cursor.
        ctx.globalAlpha = 1;
        ctx.drawImage(loadedLayers.idle, 0, 0);

        if (pointer) {
            for (const cell of cells) {
                if (getProximity(pointer, cell, INTERACTION_RADIUS) <= 0) {
                    continue;
                }
                drawCell(ctx, cell, loadedLayers, pointer, fade);
            }
        }
    } else {
        // No idle bake yet, image failed to load, or a transition crossfade
        // is in progress (fade < 1) — exact per-cell compositing, matching
        // the previous behavior pixel for pixel. This path only runs for
        // the ~900ms transition-in, never during steady-state interaction.
        ctx.globalAlpha = fade;
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, width, height);

        if (loadedLayers) {
            for (const cell of cells) {
                drawCell(ctx, cell, loadedLayers, pointer, fade);
            }
        }
    }

    drawGridLines(ctx, state);
    ctx.restore();
}

function pickLayer(cell, layers) {
    return cell.group === 0
        ? layers.source
        : cell.group === 1
          ? layers.edges
          : layers.text;
}

function paintCell(ctx, cell, layer, { blur, opacity, saturate, contrast }) {
    const pad = Math.ceil(blur * 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();

    ctx.globalAlpha = opacity;
    ctx.filter =
        blur > 0
            ? `blur(${blur}px) saturate(${saturate}) contrast(${contrast})`
            : `saturate(${saturate}) contrast(${contrast})`;

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

// Sharpened rendering for a cell near the pointer. Cells outside
// INTERACTION_RADIUS never reach this function in the steady-state path —
// they're already correct in the pre-baked idle layer.
function drawCell(ctx, cell, layers, pointer, fade) {
    const proximity = pointer
        ? getProximity(pointer, cell, INTERACTION_RADIUS)
        : 0;
    const eased = easeOutCubic(proximity);

    paintCell(ctx, cell, pickLayer(cell, layers), {
        blur: lerp(IDLE_BLUR, 0, eased),
        opacity: lerp(MIN_OPACITY, 1, eased) * fade,
        saturate: lerp(0.82, 1, eased),
        contrast: lerp(0.9, 1, eased),
    });
}

// Idle (no pointer influence) rendering, used only by buildIdleCanvas.
function drawCellIdle(ctx, cell, layers) {
    paintCell(ctx, cell, pickLayer(cell, layers), {
        blur: IDLE_BLUR,
        opacity: MIN_OPACITY,
        saturate: 0.82,
        contrast: 0.9,
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

    ctx.fillStyle = BACKGROUND;
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
