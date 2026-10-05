import type { Swatch } from './color'

/**
 * A single stitch within a Pattern Unit, positioned relative to its bounding
 * box's top-left corner. `swatchId === null` means "explicitly empty" — part
 * of the captured shape, but blank — which is distinct from a cell simply
 * absent from `cells` altogether, meaning "outside the captured shape" and
 * left completely untouched wherever the pattern is stamped.
 */
export type PatternCell = {
  dx: number
  dy: number
  swatchId: string | null
}

/**
 * A reusable, named stitch motif captured from a selection (rectangular or
 * lasso) and stored per-profile — shared across every project in that
 * profile, same scope as global color swatches. Colors are referenced by
 * swatch id rather than raw slot number, since slot numbers aren't unique
 * across projects; see `placePatternCells` for how that reference is
 * resolved back to a concrete grid value at stamp time.
 */
export type PatternUnit = {
  id: string
  profileId: string
  name: string
  width: number
  height: number
  cells: PatternCell[]
  createdAt: string
}

/**
 * Build a Pattern Unit from a raw capture — grid-space cells paired with the
 * swatch slot painted there at capture time — normalizing to a tight
 * bounding box and resolving each slot to the swatch that currently owns it.
 * Returns null for an empty capture (nothing to save).
 */
export const buildPatternUnit = (
  id: string,
  profileId: string,
  name: string,
  rawCells: Array<{ x: number; y: number; slot: number }>,
  swatches: Swatch[],
): PatternUnit | null => {
  if (rawCells.length === 0) return null

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const c of rawCells) {
    if (c.x < minX) minX = c.x
    if (c.x > maxX) maxX = c.x
    if (c.y < minY) minY = c.y
    if (c.y > maxY) maxY = c.y
  }

  const slotToSwatchId = new Map(swatches.map((s) => [s.slot, s.id]))
  const cells: PatternCell[] = rawCells.map((c) => ({
    dx: c.x - minX,
    dy: c.y - minY,
    swatchId: c.slot > 0 ? (slotToSwatchId.get(c.slot) ?? null) : null,
  }))

  return {
    id,
    profileId,
    name,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    cells,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Where a Pattern Unit's top-left corner lands when it's centered on
 * (centerX, centerY) — the Stamp tool's anchor convention (the cursor marks
 * the pattern's center, not its corner). Even dimensions are biased one cell
 * toward the top-left, matching the `Math.floor` rounding used elsewhere.
 */
export const patternTopLeft = (
  unit: Pick<PatternUnit, 'width' | 'height'>,
  centerX: number,
  centerY: number,
): { x: number; y: number } => ({
  x: centerX - Math.floor((unit.width - 1) / 2),
  y: centerY - Math.floor((unit.height - 1) / 2),
})

/** A Pattern Unit cell translated to absolute grid coordinates, with its
 *  swatch reference resolved to a concrete slot for the *current* set of
 *  available swatches. `slot: null` means the reference couldn't be
 *  resolved (e.g. a project-scoped swatch from a different project than the
 *  one it was captured in) — callers should skip these cells entirely
 *  rather than clearing them, so stamping into an unrelated project never
 *  destructively blanks what it can't faithfully reproduce. */
export type PlacedPatternCell = { x: number; y: number; slot: number | null }

export const placePatternCells = (
  unit: Pick<PatternUnit, 'width' | 'height' | 'cells'>,
  centerX: number,
  centerY: number,
  swatches: Swatch[],
): PlacedPatternCell[] => {
  const top = patternTopLeft(unit, centerX, centerY)
  const slotBySwatchId = new Map(swatches.map((s) => [s.id, s.slot]))
  return unit.cells.map((c) => ({
    x: top.x + c.dx,
    y: top.y + c.dy,
    slot: c.swatchId === null ? 0 : (slotBySwatchId.get(c.swatchId) ?? null),
  }))
}
