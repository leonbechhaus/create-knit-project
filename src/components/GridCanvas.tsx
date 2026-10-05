import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LuArrowRight, LuRuler, LuScanLine, LuSquareDashed, LuX } from 'react-icons/lu'

import appStyles from '../App.module.css'
import { hslToCss, type Swatch } from '../domain/color'
import { patternTopLeft, placePatternCells } from '../domain/patternUnit'
import { calculateCentimeters, getCell, type GaugeConfig, type Layer } from '../domain/project'
import { toCellCoordinates, rasterizeLassoPath, type PixelPoint } from '../services/paintTools'
import { useKnittingStore } from '../store/useKnittingStore'
import styles from './GridCanvas.module.css'
import { RowAnnotationsPanel } from './RowAnnotationsPanel'
import { SelectionContextMenu } from './ui/SelectionContextMenu'

// ─── Constants ─────────────────────────────────────────────────────────────────
const BASE_CELL = 24
const RULER_SIZE = 28 // fixed px — always readable
const ANNOTATIONS_WIDTH = 176 // fixed px — row icon strip + note button

// Exported so the row-annotations panel can stripe its rows with the exact
// same colors as the grid's own empty-cell checkerboard.
export const EMPTY_EVEN = '#F5EEE8'
export const EMPTY_ODD = '#EFE4D8'
const GRID_LINE = 'rgba(29, 36, 51, 0.07)'
const RULER_BG = '#F0E8DF'
const RULER_BG_ALT = '#E8DDD4'
const RULER_TEXT = 'rgba(91, 100, 119, 0.88)'
const RULER_TICK = 'rgba(91, 100, 119, 0.35)'
const HOVER_FILL = 'rgba(168, 106, 83, 0.15)'
const HOVER_STROKE = 'rgba(168, 106, 83, 0.65)'
const LINE_PREVIEW = 'rgba(168, 106, 83, 0.85)'
const SELECTION_FILL = 'rgba(79, 124, 168, 0.18)'
const SELECTION_STROKE = 'rgba(59, 98, 140, 0.9)'
const STAMP_FILL = 'rgba(130, 80, 180, 0.10)'
const STAMP_STROKE = 'rgba(130, 80, 180, 0.85)'
const STAMP_EMPTY = 'rgba(91, 100, 119, 0.22)'
const ONION_OPACITY = 0.32

// ─── Helpers ───────────────────────────────────────────────────────────────────
function buildSlotMap(swatches: Swatch[]): Map<number, string> {
  const m = new Map<number, string>()
  for (const s of swatches) m.set(s.slot, hslToCss(s.color))
  return m
}

function labelInterval(cellSize: number): number {
  if (cellSize >= 18) return 1
  if (cellSize >= 10) return 5
  if (cellSize >= 6) return 10
  return 20
}

function syncCanvas(canvas: HTMLCanvasElement | null, w: number, h: number) {
  if (!canvas) return
  canvas.width = w
  canvas.height = h
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  layer: Layer
  onionLayer?: Layer | null
  swatches: Swatch[]
  selectedSwatchId: string | null
  zoom: number
  flipY: boolean
  gauge: GaugeConfig
  onHoverCellChange?: (cell: DisplayCell | null) => void
}
type Cell = { x: number; y: number }
type Rect = { x0: number; y0: number; x1: number; y1: number }
/** A finalized freeform (lasso) selection — the exact set of enclosed cells,
 *  kept both as a lookup Set (fill/clear, boundary test) and a flat list
 *  (iteration) so neither has to be rebuilt from the other on every use. */
type LassoSelection = { cells: Set<string>; list: Cell[] }

/** A cell position already converted to the ruler's visible numbering
 *  (right-to-left columns, optionally flipped rows) — ready to display. */
export type DisplayCell = { x: number; y: number }

// ─── Component ─────────────────────────────────────────────────────────────────
export function GridCanvas({
  layer,
  onionLayer,
  swatches,
  selectedSwatchId,
  zoom,
  flipY,
  gauge,
  onHoverCellChange,
}: Props) {
  const mainRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const colRulerRef = useRef<HTMLCanvasElement>(null)
  const rowRulerRef = useRef<HTMLCanvasElement>(null)

  const isDrawing = useRef(false)
  const strokeStart = useRef<Cell | null>(null)
  const selectDrag = useRef<Cell | null>(null)
  const lassoDraft = useRef<PixelPoint[]>([])
  const lastStampCell = useRef<Cell | null>(null)
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const [lineEnd, setLineEnd] = useState<Cell | null>(null)
  const [selection, setSelection] = useState<Rect | null>(null)
  const [lassoPath, setLassoPath] = useState<PixelPoint[] | null>(null)
  const [lassoSelection, setLassoSelection] = useState<LassoSelection | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const {
    activeTool,
    beginStroke,
    paintCell,
    eraseCell,
    fillCell,
    drawLineBetween,
    clearRegion,
    paintRegion,
    clearCells,
    paintCells,
    setSelectedSwatchId,
    addRowIcon,
    removeRowIcon,
    setRowNote,
    patternUnits,
    activePatternUnitId,
    savePatternUnit,
    stampPattern,
  } = useKnittingStore()

  const activePatternUnit = useMemo(
    () => patternUnits.find((p) => p.id === activePatternUnitId) ?? null,
    [patternUnits, activePatternUnitId],
  )

  const cellSize = Math.max(4, Math.round(BASE_CELL * zoom))
  const { width: cols, height: rows } = layer
  const gridW = cols * cellSize
  const gridH = rows * cellSize

  const slotMap = useMemo(() => buildSlotMap(swatches), [swatches])

  // ─── Main canvas: grid cells only (+ optional onion-skin reference layer) ──
  const renderMain = useCallback(() => {
    const canvas = mainRef.current
    if (!canvas) return
    syncCanvas(canvas, gridW, gridH)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, gridW, gridH)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const slot = layer.grid.data[row * cols + col]
        const px = col * cellSize
        const py = row * cellSize

        if (slot > 0) {
          ctx.globalAlpha = 1
          ctx.fillStyle = slotMap.get(slot) ?? EMPTY_EVEN
          ctx.fillRect(px, py, cellSize, cellSize)
        } else {
          ctx.globalAlpha = 1
          ctx.fillStyle = (row + col) % 2 === 0 ? EMPTY_EVEN : EMPTY_ODD
          ctx.fillRect(px, py, cellSize, cellSize)

          // Onion skin only shows through empty cells, and only within the
          // reference layer's own bounds — it never extends or overdraws.
          if (onionLayer && col < onionLayer.width && row < onionLayer.height) {
            const onionSlot = getCell(onionLayer.grid, col, row)
            if (onionSlot > 0) {
              ctx.globalAlpha = ONION_OPACITY
              ctx.fillStyle = slotMap.get(onionSlot) ?? EMPTY_EVEN
              ctx.fillRect(px, py, cellSize, cellSize)
              ctx.globalAlpha = 1
            }
          }
        }

        ctx.strokeStyle = GRID_LINE
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize, cellSize)
      }
    }
  }, [layer.grid.data, onionLayer, slotMap, cellSize, cols, rows, gridW, gridH])

  // ─── Column ruler: right-to-left numbering ─────────────────────────────────
  const renderColRuler = useCallback(() => {
    const canvas = colRulerRef.current
    if (!canvas) return
    syncCanvas(canvas, gridW, RULER_SIZE)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = RULER_BG
    ctx.fillRect(0, 0, gridW, RULER_SIZE)

    // Bottom separator
    ctx.strokeStyle = 'rgba(91, 100, 119, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, RULER_SIZE - 0.5)
    ctx.lineTo(gridW, RULER_SIZE - 0.5)
    ctx.stroke()

    const every = labelInterval(cellSize)
    const fontSize = Math.max(9, Math.min(11, cellSize * 0.45))
    ctx.font = `${fontSize}px 'Inter', system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let col = 0; col < cols; col++) {
      const stitchNum = cols - col // rightmost = 1
      const cx = col * cellSize + cellSize / 2

      ctx.strokeStyle = RULER_TICK
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, RULER_SIZE - 5)
      ctx.lineTo(cx, RULER_SIZE)
      ctx.stroke()

      if (stitchNum === 1 || stitchNum % every === 0) {
        ctx.fillStyle = RULER_TEXT
        ctx.fillText(String(stitchNum), cx, RULER_SIZE / 2 - 1)
      }
    }
  }, [cellSize, cols, gridW])

  // ─── Row ruler: default top→bottom; flipY bottom→top ──────────────────────
  const renderRowRuler = useCallback(() => {
    const canvas = rowRulerRef.current
    if (!canvas) return
    syncCanvas(canvas, RULER_SIZE, gridH)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = RULER_BG
    ctx.fillRect(0, 0, RULER_SIZE, gridH)

    // Left separator
    ctx.strokeStyle = 'rgba(91, 100, 119, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0.5, 0)
    ctx.lineTo(0.5, gridH)
    ctx.stroke()

    const every = labelInterval(cellSize)
    const fontSize = Math.max(9, Math.min(11, cellSize * 0.45))
    ctx.font = `${fontSize}px 'Inter', system-ui, sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    for (let row = 0; row < rows; row++) {
      const rowNum = flipY ? rows - row : row + 1
      const cy = row * cellSize + cellSize / 2

      ctx.strokeStyle = RULER_TICK
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, cy)
      ctx.lineTo(4, cy)
      ctx.stroke()

      if (rowNum === 1 || rowNum % every === 0) {
        ctx.fillStyle = RULER_TEXT
        ctx.fillText(String(rowNum), 7, cy)
      }
    }
  }, [cellSize, rows, gridH, flipY])

  // ─── Overlay: hover + line preview ─────────────────────────────────────────
  const renderOverlay = useCallback(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    syncCanvas(canvas, gridW, gridH)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, gridW, gridH)

    // A plain single-cell hover highlight applies to every tool except
    // Stamp, which gets its own full-footprint preview below instead.
    if (hoverCell && !(activeTool === 'stamp' && activePatternUnit)) {
      const px = hoverCell.x * cellSize
      const py = hoverCell.y * cellSize
      ctx.fillStyle = HOVER_FILL
      ctx.fillRect(px, py, cellSize, cellSize)
      ctx.strokeStyle = HOVER_STROKE
      ctx.lineWidth = 1.5
      ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
    }

    if (activeTool === 'line' && strokeStart.current && lineEnd) {
      const sx = strokeStart.current.x * cellSize + cellSize / 2
      const sy = strokeStart.current.y * cellSize + cellSize / 2
      const ex = lineEnd.x * cellSize + cellSize / 2
      const ey = lineEnd.y * cellSize + cellSize / 2
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = LINE_PREVIEW
      ctx.moveTo(sx, sy)
      ctx.lineTo(ex, ey)
      ctx.stroke()
    }

    if (activeTool === 'select' && selection) {
      const minX = Math.min(selection.x0, selection.x1)
      const maxX = Math.max(selection.x0, selection.x1)
      const minY = Math.min(selection.y0, selection.y1)
      const maxY = Math.max(selection.y0, selection.y1)
      const px = minX * cellSize
      const py = minY * cellSize
      const w = (maxX - minX + 1) * cellSize
      const h = (maxY - minY + 1) * cellSize
      ctx.fillStyle = SELECTION_FILL
      ctx.fillRect(px, py, w, h)
      ctx.strokeStyle = SELECTION_STROKE
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.strokeRect(px + 0.75, py + 0.75, w - 1.5, h - 1.5)
      ctx.setLineDash([])
    }

    // Lasso, still being dragged: a smooth freeform path (closed back to its
    // start for a live preview of the eventual fill), not yet snapped to cells.
    if (activeTool === 'lasso' && lassoPath && lassoPath.length > 1) {
      ctx.beginPath()
      ctx.moveTo(lassoPath[0].x, lassoPath[0].y)
      for (let i = 1; i < lassoPath.length; i++) ctx.lineTo(lassoPath[i].x, lassoPath[i].y)
      ctx.closePath()
      ctx.fillStyle = SELECTION_FILL
      ctx.fill('evenodd')
      ctx.strokeStyle = SELECTION_STROKE
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Lasso, finalized: the exact enclosed cells, highlighted individually and
    // outlined with marching ants that hug the true (possibly irregular) edge
    // of the selection — only border segments next to a non-selected neighbour
    // are drawn, so the dashes trace the actual shape, not its bounding box.
    if (activeTool === 'lasso' && lassoSelection) {
      ctx.fillStyle = SELECTION_FILL
      for (const { x, y } of lassoSelection.list)
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

      ctx.strokeStyle = SELECTION_STROKE
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      for (const { x, y } of lassoSelection.list) {
        const px = x * cellSize
        const py = y * cellSize
        if (!lassoSelection.cells.has(`${x},${y - 1}`)) {
          ctx.moveTo(px, py)
          ctx.lineTo(px + cellSize, py)
        }
        if (!lassoSelection.cells.has(`${x},${y + 1}`)) {
          ctx.moveTo(px, py + cellSize)
          ctx.lineTo(px + cellSize, py + cellSize)
        }
        if (!lassoSelection.cells.has(`${x - 1},${y}`)) {
          ctx.moveTo(px, py)
          ctx.lineTo(px, py + cellSize)
        }
        if (!lassoSelection.cells.has(`${x + 1},${y}`)) {
          ctx.moveTo(px + cellSize, py)
          ctx.lineTo(px + cellSize, py + cellSize)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Stamp tool: the cursor marks the pattern's center — show its full
    // footprint (bounding-box wash + each cell's actual resolved color, so
    // it reads as a real preview of what will be stamped, not just an empty
    // outline) wherever the mouse currently hovers.
    if (activeTool === 'stamp' && activePatternUnit && hoverCell) {
      const top = patternTopLeft(activePatternUnit, hoverCell.x, hoverCell.y)
      const boxX = top.x * cellSize
      const boxY = top.y * cellSize
      const boxW = activePatternUnit.width * cellSize
      const boxH = activePatternUnit.height * cellSize

      ctx.fillStyle = STAMP_FILL
      ctx.fillRect(boxX, boxY, boxW, boxH)

      ctx.globalAlpha = 0.75
      for (const { x, y, slot } of placePatternCells(
        activePatternUnit,
        hoverCell.x,
        hoverCell.y,
        swatches,
      )) {
        if (slot === null) continue // unresolved reference — won't actually be stamped here
        ctx.fillStyle = slot > 0 ? (slotMap.get(slot) ?? STAMP_EMPTY) : STAMP_EMPTY
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
      ctx.globalAlpha = 1

      ctx.strokeStyle = STAMP_STROKE
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.strokeRect(boxX + 0.75, boxY + 0.75, boxW - 1.5, boxH - 1.5)
      ctx.setLineDash([])
    }
  }, [
    hoverCell,
    lineEnd,
    selection,
    lassoPath,
    lassoSelection,
    activeTool,
    cellSize,
    gridW,
    gridH,
    activePatternUnit,
    swatches,
    slotMap,
  ])

  useEffect(() => {
    renderMain()
  }, [renderMain])
  useEffect(() => {
    renderColRuler()
  }, [renderColRuler])
  useEffect(() => {
    renderRowRuler()
  }, [renderRowRuler])
  useEffect(() => {
    renderOverlay()
  }, [renderOverlay])

  // ─── Notify the parent of the current hover cell, in the same right-to-left
  // (and optionally flipped) numbering the rulers display ─────────────────────
  useEffect(() => {
    onHoverCellChange?.(
      hoverCell ? { x: cols - hoverCell.x, y: flipY ? rows - hoverCell.y : hoverCell.y + 1 } : null,
    )
  }, [hoverCell, cols, rows, flipY, onHoverCellChange])

  // ─── Selection status badge: display range + size (stitches & cm), plus the
  // pixel position for the floating label anchored just below the marquee.
  // Works for both a rectangular "select" drag and a finalized lasso
  // selection — both reduce to a bounding box plus an exact cell count
  // (identical to width×height for a rectangle, smaller for an irregular
  // lasso shape, which the badge then calls out separately).
  // Lives entirely in this component — no parent notification needed, since
  // the badge is rendered right here over the canvas. ──────────────────────
  const selectionBadge = useMemo(() => {
    let minX: number, maxX: number, minY: number, maxY: number, cellCount: number
    if (activeTool === 'select' && selection) {
      minX = Math.min(selection.x0, selection.x1)
      maxX = Math.max(selection.x0, selection.x1)
      minY = Math.min(selection.y0, selection.y1)
      maxY = Math.max(selection.y0, selection.y1)
      cellCount = (maxX - minX + 1) * (maxY - minY + 1)
    } else if (activeTool === 'lasso' && lassoSelection && lassoSelection.list.length > 0) {
      minX = minY = Infinity
      maxX = maxY = -Infinity
      for (const c of lassoSelection.list) {
        minX = Math.min(minX, c.x)
        maxX = Math.max(maxX, c.x)
        minY = Math.min(minY, c.y)
        maxY = Math.max(maxY, c.y)
      }
      cellCount = lassoSelection.list.length
    } else {
      return null
    }
    const dispXa = cols - minX
    const dispXb = cols - maxX
    const dispYa = flipY ? rows - minY : minY + 1
    const dispYb = flipY ? rows - maxY : maxY + 1
    const widthStitches = maxX - minX + 1
    const heightStitches = maxY - minY + 1
    return {
      xStart: Math.min(dispXa, dispXb),
      xEnd: Math.max(dispXa, dispXb),
      yStart: Math.min(dispYa, dispYb),
      yEnd: Math.max(dispYa, dispYb),
      widthStitches,
      heightStitches,
      cellCount,
      widthCm: calculateCentimeters(widthStitches, gauge.stitchGauge),
      heightCm: calculateCentimeters(heightStitches, gauge.rowGauge),
      pxCenterX: ((minX + maxX + 1) / 2) * cellSize,
      pxBottom: (maxY + 1) * cellSize,
      // Anchor for the context menu — just outside the selection's top-right
      // corner, clear of the status badge that floats beneath the marquee.
      pxMenuX: (maxX + 1) * cellSize + 6,
      pxMenuY: minY * cellSize,
    }
  }, [selection, lassoSelection, activeTool, cols, rows, flipY, cellSize, gauge])

  // Selection is scoped to a single tool gesture on a single layer — drop it
  // whenever either changes so a stale marquee can't linger or delete the
  // wrong layer's cells. Adjusted during render (React's recommended pattern
  // for resetting state in response to a prop/derived change) rather than an
  // effect, since there's no external system to synchronize with here.
  const selectionKey = `${layer.id}:${activeTool}`
  const [prevSelectionKey, setPrevSelectionKey] = useState(selectionKey)
  if (prevSelectionKey !== selectionKey) {
    setPrevSelectionKey(selectionKey)
    if (selection !== null) setSelection(null)
    if (lassoSelection !== null) setLassoSelection(null)
    if (lassoPath !== null) setLassoPath(null)
    if (hoverCell !== null) setHoverCell(null)
    if (menuOpen) setMenuOpen(false)
  }

  // ─── Pointer helpers ────────────────────────────────────────────────────────
  const resolveSlot = (): number => {
    const swatch = swatches.find((s) => s.id === selectedSwatchId) ?? swatches[0]
    return swatch?.slot ?? 0
  }

  // The overlay canvas covers exactly the grid — no offset needed
  const toCell = (e: React.PointerEvent<HTMLCanvasElement>): Cell => {
    const rect = e.currentTarget.getBoundingClientRect()
    return toCellCoordinates(e.clientX, e.clientY, rect, cols, rows, cellSize, 0, 0)
  }

  // Raw (sub-cell) pixel position, clamped to the grid — used for the lasso's
  // freeform path so it isn't blocky while being traced.
  const toPixel = (e: React.PointerEvent<HTMLCanvasElement>): PixelPoint => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(gridW, e.clientX - rect.left)),
      y: Math.max(0, Math.min(gridH, e.clientY - rect.top)),
    }
  }

  // ─── Pointer events ─────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Right/middle-click never draws or starts a selection — right-click is
    // reserved for the context menu, handled separately via onContextMenu.
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const cell = toCell(e)
    const slot = resolveSlot()

    if (activeTool === 'eyedropper') {
      const s = getCell(layer.grid, cell.x, cell.y)
      const found = swatches.find((sw) => sw.slot === s)
      if (found) setSelectedSwatchId(found.id)
      return
    }

    if (activeTool === 'select') {
      selectDrag.current = cell
      setSelection({ x0: cell.x, y0: cell.y, x1: cell.x, y1: cell.y })
      setMenuOpen(false)
      isDrawing.current = true
      return
    }

    if (activeTool === 'lasso') {
      const pt = toPixel(e)
      lassoDraft.current = [pt]
      setLassoPath([pt])
      setLassoSelection(null)
      setMenuOpen(false)
      isDrawing.current = true
      return
    }

    if (activeTool === 'stamp') {
      if (!activePatternUnit) return
      beginStroke()
      stampPattern(cell.x, cell.y)
      lastStampCell.current = cell
      isDrawing.current = true
      return
    }

    beginStroke()

    if (activeTool === 'fill') {
      fillCell(cell.x, cell.y, slot)
      return
    }
    if (activeTool === 'line') {
      strokeStart.current = cell
      setLineEnd(cell)
      isDrawing.current = true
      return
    }

    isDrawing.current = true
    if (activeTool === 'paint') paintCell(cell.x, cell.y, slot)
    if (activeTool === 'erase') eraseCell(cell.x, cell.y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = toCell(e)
    setHoverCell(cell)
    if (!isDrawing.current) return
    if (activeTool === 'paint') paintCell(cell.x, cell.y, resolveSlot())
    if (activeTool === 'erase') eraseCell(cell.x, cell.y)
    if (activeTool === 'line') setLineEnd(cell)
    if (activeTool === 'select' && selectDrag.current) {
      setSelection({ x0: selectDrag.current.x, y0: selectDrag.current.y, x1: cell.x, y1: cell.y })
    }
    if (activeTool === 'lasso' && lassoDraft.current.length > 0) {
      const pt = toPixel(e)
      const last = lassoDraft.current[lassoDraft.current.length - 1]
      // Skip near-duplicate points so the path (and its per-frame redraw)
      // stays light even on a fast, jittery drag.
      if (Math.hypot(pt.x - last.x, pt.y - last.y) >= 2) {
        lassoDraft.current = [...lassoDraft.current, pt]
        setLassoPath(lassoDraft.current)
      }
    }
    // Continuous stamping while dragging — but only when the *centered*
    // cell actually changes, so a slow drag doesn't re-stamp dozens of
    // overlapping copies into the same spot.
    if (activeTool === 'stamp' && activePatternUnit) {
      const last = lastStampCell.current
      if (!last || last.x !== cell.x || last.y !== cell.y) {
        stampPattern(cell.x, cell.y)
        lastStampCell.current = cell
      }
    }
  }

  const handlePointerUp = (_e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'line' && strokeStart.current && lineEnd) {
      drawLineBetween(
        strokeStart.current.x,
        strokeStart.current.y,
        lineEnd.x,
        lineEnd.y,
        resolveSlot(),
      )
      strokeStart.current = null
      setLineEnd(null)
    }
    // A completed select-drag immediately surfaces the context menu — no
    // right-click required, so the fill/clear actions are always one click away.
    if (activeTool === 'select' && selectDrag.current) {
      setMenuOpen(true)
    }
    // A completed lasso drag is rasterized into whole grid cells right away,
    // same one-click-away context menu as the rectangular select tool.
    if (activeTool === 'lasso' && lassoDraft.current.length > 0) {
      const cells = rasterizeLassoPath(lassoDraft.current, cellSize, cols, rows)
      if (cells.length > 0) {
        setLassoSelection({ cells: new Set(cells.map((c) => `${c.x},${c.y}`)), list: cells })
        setMenuOpen(true)
      }
      lassoDraft.current = []
      setLassoPath(null)
    }
    selectDrag.current = null
    lastStampCell.current = null
    isDrawing.current = false
  }

  const handlePointerLeave = () => {
    setHoverCell(null)
    if (isDrawing.current && activeTool === 'line') {
      strokeStart.current = null
      setLineEnd(null)
    }
    lastStampCell.current = null
    isDrawing.current = false
  }

  // The menu already opens automatically once a selection is made; right-click
  // just re-opens it if it was dismissed, still suppressing the native menu.
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (activeTool === 'select' && selection) {
      setMenuOpen(true)
      return
    }
    if (activeTool === 'lasso' && lassoSelection) {
      setMenuOpen(true)
      return
    }
  }

  const handleClearSelection = () => {
    if (activeTool === 'select' && selection) {
      beginStroke()
      clearRegion(selection.x0, selection.y0, selection.x1, selection.y1)
    } else if (activeTool === 'lasso' && lassoSelection) {
      beginStroke()
      clearCells(lassoSelection.list)
    }
  }

  const handleFillSelection = (slot: number) => {
    if (activeTool === 'select' && selection) {
      beginStroke()
      paintRegion(selection.x0, selection.y0, selection.x1, selection.y1, slot)
    } else if (activeTool === 'lasso' && lassoSelection) {
      beginStroke()
      paintCells(lassoSelection.list, slot)
    }
  }

  // Captures the current selection's actual grid contents (including
  // deliberately-empty cells) into a new Pattern Unit, ready to be placed
  // elsewhere with the Stamp tool.
  const handleSaveAsPattern = (name: string) => {
    const rawCells: Array<{ x: number; y: number; slot: number }> = []
    if (activeTool === 'select' && selection) {
      const minX = Math.min(selection.x0, selection.x1)
      const maxX = Math.max(selection.x0, selection.x1)
      const minY = Math.min(selection.y0, selection.y1)
      const maxY = Math.max(selection.y0, selection.y1)
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) rawCells.push({ x, y, slot: getCell(layer.grid, x, y) })
      }
    } else if (activeTool === 'lasso' && lassoSelection) {
      for (const { x, y } of lassoSelection.list)
        rawCells.push({ x, y, slot: getCell(layer.grid, x, y) })
    }
    if (rawCells.length > 0) savePatternUnit(name, rawCells)
  }

  // ─── Keyboard: Delete/Backspace clears a selection, Escape cancels it ──────
  useEffect(() => {
    if (activeTool !== 'select' && activeTool !== 'lasso') return
    const onKeyDown = (e: KeyboardEvent) => {
      const hasSelection = activeTool === 'select' ? selection !== null : lassoSelection !== null
      if (!hasSelection) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        beginStroke()
        if (activeTool === 'select' && selection) {
          clearRegion(selection.x0, selection.y0, selection.x1, selection.y1)
        } else if (activeTool === 'lasso' && lassoSelection) {
          clearCells(lassoSelection.list)
        }
      } else if (e.key === 'Escape') {
        // The context menu owns the first Escape press while it's open —
        // let it close before this clears the selection underneath it.
        if (menuOpen) return
        if (activeTool === 'select') setSelection(null)
        else setLassoSelection(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTool, selection, lassoSelection, menuOpen, beginStroke, clearRegion, clearCells])

  return (
    <div
      className={styles.canvasWrapper}
      style={{
        gridTemplateColumns: `${gridW}px ${RULER_SIZE}px ${ANNOTATIONS_WIDTH}px`,
        gridTemplateRows: `${RULER_SIZE}px ${gridH}px`,
      }}
    >
      {/* Column ruler — sticky top, scrolls horizontally with canvas */}
      <canvas ref={colRulerRef} className={styles.colRuler} />

      {/* Corner — sticky to both top and right of the row ruler */}
      <div
        className={styles.corner}
        style={{ background: RULER_BG_ALT, right: ANNOTATIONS_WIDTH }}
      />

      {/* Annotations header — sticky to both top and right, outermost corner */}
      <div className={styles.annotationsCorner} style={{ background: RULER_BG_ALT }} />

      {/* Grid area: main canvas + pointer-event overlay stacked */}
      <div className={styles.gridArea}>
        <canvas ref={mainRef} className={styles.mainCanvas} />
        <canvas
          ref={overlayRef}
          className={styles.overlayCanvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
        />

        {/* Selection status badge — floats just below the marquee, in the
            same pill design as the hover status bar. A lasso's shape is
            amorphous, so it only ever shows the one thing that's exact for
            any shape — the stitch count — never a bounding-box range/size
            that would misleadingly imply a rectangle. */}
        {selectionBadge && (
          <div
            className={styles.selectionBadge}
            style={{ left: selectionBadge.pxCenterX, top: selectionBadge.pxBottom }}
          >
            {activeTool === 'lasso' ? (
              <span className={appStyles.coordBarItem}>
                <LuSquareDashed size={13} strokeWidth={2} />
                {selectionBadge.cellCount} st selected
              </span>
            ) : (
              <>
                <span className={appStyles.coordBarItem}>
                  <LuScanLine size={13} strokeWidth={2} />
                  {selectionBadge.xStart}, {selectionBadge.yStart}{' '}
                  <LuArrowRight className={appStyles.coordBarSep} size={12} strokeWidth={2} />{' '}
                  {selectionBadge.xEnd}, {selectionBadge.yEnd}
                </span>
                <span className={appStyles.coordBarDivider} />
                <span className={appStyles.coordBarItem}>
                  <LuRuler size={13} strokeWidth={2} />
                  {selectionBadge.widthStitches}
                  <LuX className={appStyles.coordBarSep} size={10} strokeWidth={2} />
                  {selectionBadge.heightStitches} st
                </span>
                <span className={appStyles.coordBarDivider} />
                <span className={appStyles.coordBarItem}>
                  {selectionBadge.widthCm}
                  <LuX className={appStyles.coordBarSep} size={10} strokeWidth={2} />
                  {selectionBadge.heightCm} cm
                </span>
              </>
            )}
          </div>
        )}

        {/* Context menu — opens automatically once a selection is made,
            anchored just outside its top-right corner */}
        {menuOpen && selectionBadge && (selection || lassoSelection) && (
          <SelectionContextMenu
            position={{ x: selectionBadge.pxMenuX, y: selectionBadge.pxMenuY }}
            swatches={swatches}
            onPickColor={handleFillSelection}
            onClear={handleClearSelection}
            onSaveAsPattern={handleSaveAsPattern}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {/* Row ruler — sticky right (just left of the annotations column), scrolls vertically with canvas */}
      <canvas ref={rowRulerRef} className={styles.rowRuler} style={{ right: ANNOTATIONS_WIDTH }} />

      {/* Row annotations — sticky right (outermost column), scrolls vertically with canvas */}
      <div className={styles.annotationsColumn}>
        <RowAnnotationsPanel
          rowAnnotations={layer.rowAnnotations}
          cellSize={cellSize}
          onAddIcon={addRowIcon}
          onRemoveIcon={removeRowIcon}
          onSaveNote={setRowNote}
        />
      </div>
    </div>
  )
}
