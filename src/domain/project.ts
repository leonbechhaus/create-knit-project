export type ToolKind =
  'paint' | 'erase' | 'fill' | 'line' | 'eyedropper' | 'select' | 'lasso' | 'stamp'

/** Stitches/rows per 10 cm — the only two numbers gauge is ever expressed in. */
export type GaugeConfig = {
  stitchGauge: number // horizontal: stitches per 10 cm
  rowGauge: number // vertical: rows per 10 cm
}

/**
 * Flat, row-major grid stored in a Uint16Array.
 * index = y * width + x
 * value 0 = empty, 1..65535 = swatch slot
 */
export type Grid = {
  width: number
  height: number
  data: Uint16Array
}

/**
 * Per-row chart annotations shown in the strip beside the row ruler: an
 * arbitrary number of stitch-symbol icons (e.g. cable/lace markers for that
 * row) plus one free-text note. Indexed 1:1 with grid row (array index
 * matches the row's raw, unflipped `y`), independent of `flipY` display order.
 */
export type RowAnnotation = {
  icons: string[] // StitchSymbol ids, in display order
  note: string
}

export const createEmptyRowAnnotations = (height: number): RowAnnotation[] =>
  Array.from({ length: height }, () => ({ icons: [], note: '' }))

/**
 * A single piece of the garment (e.g. "Front", "Back", "Sleeve").
 * Every layer owns its own grid and target size. Gauge is inherited from the
 * project unless `gaugeOverride` is set, in which case it is used instead.
 * `connectedLayerId` optionally links this layer to one other layer so that
 * stitch-count rounding can be resolved jointly across the pair (see
 * `resolveJointRounding`).
 */
export type Layer = {
  id: string
  name: string
  width: number // grid columns (stitches per row)
  height: number // grid rows
  gaugeOverride: GaugeConfig | null
  targetWidthCm: number // desired physical width
  targetHeightCm: number // desired physical height
  cmWidth: number // actual physical width  (derived)
  cmHeight: number // actual physical height (derived)
  connectedLayerId: string | null
  grid: Grid
  rowAnnotations: RowAnnotation[]
}

export type Project = {
  id: string
  name: string
  gauge: GaugeConfig // project-wide default gauge
  activeSwatchId: string | null
  layers: Layer[]
  activeLayerId: string
}

export const getActiveLayer = (project: Project): Layer | undefined =>
  project.layers.find((l) => l.id === project.activeLayerId)

/** The gauge actually used by a layer — its own override, or the project default. */
export const effectiveGauge = (layer: Layer, project: Project): GaugeConfig =>
  layer.gaugeOverride ?? project.gauge

export const calculateCentimeters = (stitches: number, gaugePerCm: number): number =>
  Number(((stitches / gaugePerCm) * 10).toFixed(2))

/** Calculate raw (possibly fractional) stitch count from cm target + gauge. */
export const rawStitches = (targetCm: number, gaugePerCm: number): number =>
  (targetCm / 10) * gaugePerCm

/**
 * Largest-remainder apportionment: given a set of raw (possibly fractional)
 * stitch counts that belong together (connected layers sharing a seam), round
 * each one to a whole number while keeping the *group total* as close as
 * possible to the sum of the raw values.
 *
 * Example: [50.5, 50.5] → sum 101 (already whole) → [51, 50], never [50, 50]
 * or [51, 51], so no stitch is silently gained or lost across the seam.
 */
export const resolveJointRounding = (rawValues: number[]): number[] => {
  if (rawValues.length === 0) return []

  const bases = rawValues.map((v) => Math.floor(v))
  const baseSum = bases.reduce((a, b) => a + b, 0)
  const total = rawValues.reduce((a, b) => a + b, 0)
  const targetTotal = Math.round(total)
  const diff = targetTotal - baseSum // >0: need `diff` entries bumped up by 1; <0: need some bumped down

  const byFraction = rawValues
    .map((v, i) => ({ i, frac: v - bases[i] }))
    .sort((a, b) => b.frac - a.frac) // largest fractional remainder first

  const result = [...bases]
  if (diff > 0) {
    for (let k = 0; k < diff && k < byFraction.length; k++) result[byFraction[k].i] += 1
  } else if (diff < 0) {
    const bySmallestFraction = [...byFraction].reverse()
    for (let k = 0; k < -diff && k < bySmallestFraction.length; k++)
      result[bySmallestFraction[k].i] -= 1
  }
  return result
}

export const createEmptyGrid = (width: number, height: number): Grid => ({
  width,
  height,
  data: new Uint16Array(width * height), // all zeros = all empty
})

/** Build a new layer, computing its grid size from the given (or project) gauge. */
export const createLayer = (
  id: string,
  name: string,
  opts: {
    gaugeOverride?: GaugeConfig | null
    targetWidthCm: number
    targetHeightCm: number
    projectGauge: GaugeConfig
    connectedLayerId?: string | null
  },
): Layer => {
  const gauge = opts.gaugeOverride ?? opts.projectGauge
  const width = Math.max(1, Math.round(rawStitches(opts.targetWidthCm, gauge.stitchGauge)))
  const height = Math.max(1, Math.round(rawStitches(opts.targetHeightCm, gauge.rowGauge)))
  return {
    id,
    name,
    width,
    height,
    gaugeOverride: opts.gaugeOverride ?? null,
    targetWidthCm: opts.targetWidthCm,
    targetHeightCm: opts.targetHeightCm,
    cmWidth: calculateCentimeters(width, gauge.stitchGauge),
    cmHeight: calculateCentimeters(height, gauge.rowGauge),
    connectedLayerId: opts.connectedLayerId ?? null,
    grid: createEmptyGrid(width, height),
    rowAnnotations: createEmptyRowAnnotations(height),
  }
}

/** Resize a row-annotations array to a new height, preserving overlapping
 *  rows by index (same top-down convention as `resizeGrid`). */
export const resizeRowAnnotations = (old: RowAnnotation[], height: number): RowAnnotation[] =>
  Array.from({ length: height }, (_, y) => old[y] ?? { icons: [], note: '' })

/** O(n) single-allocation copy — much cheaper than nested array clone. */
export const cloneGrid = (grid: Grid): Grid => ({
  ...grid,
  data: new Uint16Array(grid.data),
})

export const getCell = (grid: Grid, x: number, y: number): number =>
  grid.data[y * grid.width + x] ?? 0

export const setCell = (grid: Grid, x: number, y: number, slot: number): void => {
  grid.data[y * grid.width + x] = slot
}

/**
 * Flood fill using a stack (DFS, O(1) pop) instead of a queue (BFS, O(n) shift).
 * Significantly faster for large grids.
 */
export const floodFill = (grid: Grid, startX: number, startY: number, slot: number): Grid => {
  const { width, height } = grid
  const nextData = new Uint16Array(grid.data)
  const target = nextData[startY * width + startX] ?? 0

  if (target === slot) return { ...grid, data: nextData }

  const stack: number[] = [startY * width + startX]

  while (stack.length > 0) {
    const idx = stack.pop()!
    if (nextData[idx] !== target) continue
    nextData[idx] = slot

    const x = idx % width
    const y = (idx / width) | 0

    if (x > 0) stack.push(idx - 1)
    if (x < width - 1) stack.push(idx + 1)
    if (y > 0) stack.push(idx - width)
    if (y < height - 1) stack.push(idx + width)
  }

  return { ...grid, data: nextData }
}

/** Bresenham's line algorithm on the flat Uint16Array. */
export const drawLine = (
  grid: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  slot: number,
): Grid => {
  const nextData = new Uint16Array(grid.data)
  const { width, height } = grid
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0

  for (;;) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      nextData[y * width + x] = slot
    }
    if (x === x1 && y === y1) break
    const e2 = err * 2
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }

  return { ...grid, data: nextData }
}

/** Serialise grid for Dexie / JSON — converts Uint16Array to plain number array. */
export const serializeGrid = (grid: Grid): { width: number; height: number; data: number[] } => ({
  width: grid.width,
  height: grid.height,
  data: Array.from(grid.data),
})

/** Deserialise grid from Dexie / JSON. */
export const deserializeGrid = (raw: {
  width: number
  height: number
  data: number[] | Uint16Array
}): Grid => ({
  width: raw.width,
  height: raw.height,
  data: raw.data instanceof Uint16Array ? raw.data : new Uint16Array(raw.data),
})
