// Loading-state canvas rendering: while the artwork/image pipeline is
// still in flight, a handful of grid cells randomly "breathe" a subtle
// highlight, and cells near the pointer brighten further. Conveys
// activity without a literal progress bar.
import { drawGridLines } from "../../utils/grid.js";
import { clamp01, lerp, easeOutCubic, now } from "./mathUtils.js";

const BACKGROUND = "#f5f5f5";
const HIGHLIGHT_RGB = [214, 214, 214]; // subtle gray the cells fade towards
const INTERACTION_RADIUS = 260;
const POINTER_PEAK = 0.85;

export function createLoadingScene(cellCount) {
    const slotCount = Math.min(18, Math.max(4, Math.round(cellCount * 0.05)));
    const slots = [];

    for (let i = 0; i < slotCount; i += 1) {
        // Stagger initial phases so slots don't all pulse in sync.
        slots.push(freshSlot(cellCount, now() - Math.random() * 1500));
    }

    return { slots };
}

export function drawLoadingScene(ctx, state) {
    const { width, height, cells, loadingScene, pointer } = state;
    const t = now();

    for (const slot of loadingScene.slots) advanceSlot(slot, t, cells.length);

    const alphas = new Float32Array(cells.length);
    for (const slot of loadingScene.slots) {
        const a = slotAlpha(slot, t);
        if (a > alphas[slot.cellIndex]) alphas[slot.cellIndex] = a;
    }

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    const [gr, gg, gb] = HIGHLIGHT_RGB;

    for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];
        let alpha = alphas[i];

        if (pointer) {
            const dx = pointer.x - cell.cx;
            const dy = pointer.y - cell.cy;
            const distance = Math.hypot(dx, dy);
            const proximity = clamp01(1 - distance / INTERACTION_RADIUS);
            const pointerAlpha = easeOutCubic(proximity) * POINTER_PEAK;
            if (pointerAlpha > alpha) alpha = pointerAlpha;
        }

        if (alpha > 0.01) {
            const r = lerp(255, gr, alpha) | 0;
            const g = lerp(255, gg, alpha) | 0;
            const b = lerp(255, gb, alpha) | 0;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
        }
    }

    drawGridLines(ctx, state);
}

// Each "slot" owns one random cell at a time, through a fade-in / hold /
// fade-out cycle, then jumps to a new random cell and repeats.
function freshSlot(cellCount, startTime) {
    return {
        cellIndex: Math.floor(Math.random() * cellCount),
        phase: "in",
        phaseStart: startTime,
        fadeIn: 380 + Math.random() * 300,
        hold: 260 + Math.random() * 500,
        fadeOut: 420 + Math.random() * 400,
        peak: 0.25 + Math.random() * 0.35,
    };
}

function advanceSlot(slot, t, cellCount) {
    const elapsed = t - slot.phaseStart;

    if (slot.phase === "in" && elapsed >= slot.fadeIn) {
        slot.phase = "hold";
        slot.phaseStart = t;
    } else if (slot.phase === "hold" && elapsed >= slot.hold) {
        slot.phase = "out";
        slot.phaseStart = t;
    } else if (slot.phase === "out" && elapsed >= slot.fadeOut) {
        Object.assign(slot, freshSlot(cellCount, t));
    }
}

function slotAlpha(slot, t) {
    const elapsed = t - slot.phaseStart;

    if (slot.phase === "in") {
        return slot.peak * easeOutCubic(clamp01(elapsed / slot.fadeIn));
    }
    if (slot.phase === "hold") {
        return slot.peak;
    }
    return slot.peak * (1 - easeOutCubic(clamp01(elapsed / slot.fadeOut)));
}
