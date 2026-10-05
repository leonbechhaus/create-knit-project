import { useEffect, useRef } from 'react'

import { hslToCss, type Swatch } from '../domain/color'
import type { PatternUnit } from '../domain/patternUnit'

const EMPTY_CELL = 'rgba(91, 100, 119, 0.16)'
const THUMB_SIZE = 40 // px, square

/**
 * A small, live-rendered canvas preview of a Pattern Unit's cells — drawn
 * fresh from `unit.cells` + the current swatches on every render rather than
 * stored as a baked bitmap, so it automatically stays in sync if a
 * referenced swatch's color is edited later.
 */
export function PatternUnitThumbnail({
  unit,
  swatches,
}: {
  unit: PatternUnit
  swatches: Swatch[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = THUMB_SIZE * dpr
    canvas.height = THUMB_SIZE * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE)

    const swatchById = new Map(swatches.map((s) => [s.id, s]))
    const cell = Math.max(1, THUMB_SIZE / Math.max(unit.width, unit.height))
    const offsetX = (THUMB_SIZE - unit.width * cell) / 2
    const offsetY = (THUMB_SIZE - unit.height * cell) / 2

    for (const c of unit.cells) {
      const swatch = c.swatchId ? swatchById.get(c.swatchId) : undefined
      ctx.fillStyle = swatch ? hslToCss(swatch.color) : EMPTY_CELL
      ctx.fillRect(offsetX + c.dx * cell, offsetY + c.dy * cell, cell, cell)
    }
  }, [unit, swatches])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 4, flexShrink: 0 }}
    />
  )
}
