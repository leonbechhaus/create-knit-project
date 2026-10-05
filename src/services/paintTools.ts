export type PointerCell = {
  x: number
  y: number
}

/**
 * Map a pointer position to a grid cell.
 * offsetX / offsetY are the pixel distances from the canvas edge to the grid's top-left corner.
 */
export const toCellCoordinates = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
  columns: number,
  rows: number,
  cellSize: number,
  offsetX: number,
  offsetY: number,
): PointerCell => {
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const col = cellSize > 0 ? Math.floor((localX - offsetX) / cellSize) : 0
  const row = cellSize > 0 ? Math.floor((localY - offsetY) / cellSize) : 0
  return {
    x: Math.max(0, Math.min(columns - 1, col)),
    y: Math.max(0, Math.min(rows - 1, row)),
  }
}

export const clampCell = (cell: number, max: number): number => Math.max(0, Math.min(cell, max))

/** A raw pixel position within the grid area (not yet snapped to a cell). */
export type PixelPoint = { x: number; y: number }

/** Even-odd point-in-polygon test, operating in the same pixel space as `points`. */
const pointInPolygon = (x: number, y: number, points: PixelPoint[]): boolean => {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x
    const yi = points[i].y
    const xj = points[j].x
    const yj = points[j].y
    const crosses = yi > y !== yj > y
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * Rasterize a freeform lasso path (raw pixel points, implicitly closed back to
 * the first point) into the whole grid cells whose centers fall inside it.
 * Only scans the path's own bounding box — clamped to the grid — rather than
 * the whole grid, so cost scales with the lassoed area, not the grid size.
 */
export const rasterizeLassoPath = (
  points: PixelPoint[],
  cellSize: number,
  columns: number,
  rows: number,
): PointerCell[] => {
  if (points.length < 3 || cellSize <= 0) return []

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const colMin = clampCell(Math.floor(minX / cellSize), columns - 1)
  const colMax = clampCell(Math.ceil(maxX / cellSize), columns - 1)
  const rowMin = clampCell(Math.floor(minY / cellSize), rows - 1)
  const rowMax = clampCell(Math.ceil(maxY / cellSize), rows - 1)

  const cells: PointerCell[] = []
  for (let row = rowMin; row <= rowMax; row++) {
    const cy = row * cellSize + cellSize / 2
    for (let col = colMin; col <= colMax; col++) {
      const cx = col * cellSize + cellSize / 2
      if (pointInPolygon(cx, cy, points)) cells.push({ x: col, y: row })
    }
  }
  return cells
}
