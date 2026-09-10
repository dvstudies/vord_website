// Small math helpers shared by the loading-state and loaded-state canvas
// renderers (see loadingScene.js / loadedScene.js).

export function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function clamp01(value) {
    return clamp(value, 0, 1);
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export function getProximity(pointer, cell, radius) {
    const dx = pointer.x - cell.cx;
    const dy = pointer.y - cell.cy;
    const distance = Math.hypot(dx, dy);
    return clamp01(1 - distance / radius);
}
