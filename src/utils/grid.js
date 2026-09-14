// Single source of truth for the site's square grid.
//
// The grid is fit to the viewport in two steps:
//  1. Vertically: pick a row count close to `baseCellSize` such that
//     cellSize * rows === height exactly — no row is ever clipped.
//  2. Horizontally: using that exact cellSize, fit as many whole columns
//     as possible; whatever width is left over is split evenly as two
//     equally-clipped edge columns (left + right), centering the grid.
//
// Every grid on the site — the interactive landing canvas (in both its
// loading and loaded states) and the plain CSS background grids on the
// sections below it — must derive its cell size and horizontal offset
// from this same function so they always line up with each other.
export const BASE_CELL_SIZE = 72;

export function computeGridMetrics(
    width,
    height,
    baseCellSize = BASE_CELL_SIZE,
) {
    const rows = Math.max(1, Math.round(height / baseCellSize));
    const cellSize = height / rows;
    const cols = Math.max(1, Math.floor(width / cellSize));
    const offsetX = (width - cols * cellSize) / 2;

    return {
        cellSize: Math.round(cellSize),
        rows,
        cols,
        offsetX: Math.round(offsetX),
    };
}

// Publishes the current grid metrics as CSS custom properties on the root
// element, so plain CSS background-grids (see global.css) can stay in
// lockstep with the canvas grid without any JS wiring of their own.
export function publishGridCssVars(metrics) {
    const root = document.documentElement;
    root.style.setProperty("--grid-size", `${metrics.cellSize}px`);
    root.style.setProperty("--grid-offset-x", `${metrics.offsetX}px`);
}

// Builds the shared cell-rectangle layout (position + size + row/col
// index) for a grid with the given metrics. Column index -1 and `cols`
// are the equally-clipped edge columns that absorb the horizontal
// leftover (offsetX on each side); every row spans a full, unclipped
// cellSize since rows * cellSize === height.
//
// Both the loading-state and loaded-state renderers (see
// components/Grid/loadingScene.js and loadedScene.js) build their
// per-cell animation state on top of this same layout, so switching
// between the two never shifts a single cell.
export function makeGridCells(width, height, cellSize, offsetX, rows, cols) {
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
        const y = row * cellSize;
        const h = cellSize;

        for (let col = -1; col <= cols; col += 1) {
            let x = offsetX + col * cellSize;
            let w = cellSize;

            if (x < 0) {
                w += x;
                x = 0;
            }
            if (x + w > width) {
                w = width - x;
            }
            if (w <= 0) continue;

            cells.push({
                row,
                col,
                x,
                y,
                w,
                h,
                cx: x + w / 2,
                cy: y + h / 2,
            });
        }
    }

    return cells;
}

// Draws the grid lines for a given layout — used by every canvas grid on
// the site (the loading-state and loaded-state renderers in
// components/Grid/) so the lines always render identically between them.
export function drawGridLines(
    ctx,
    { width, height, cellSize, rows, cols, offsetX },
) {
    ctx.save();
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1;

    for (let col = 0; col <= cols; col += 1) {
        const x = offsetX + col * cellSize;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
    }

    for (let row = 0; row <= rows; row += 1) {
        const y = row * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
    }

    ctx.restore();
}
