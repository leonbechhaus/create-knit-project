// Grid mutations — the actual cell-painting operations behind every tool
// (pencil, eraser, fill bucket, line, rect/lasso selection fill-or-clear).
// All of these act on the active layer and are called after beginStroke so
// they land on the undo stack as one step.

import type { StateCreator } from 'zustand'

import { cloneGrid, drawLine, floodFill, getActiveLayer } from '../../domain/project'
import type { KnittingStore } from '../types'
import { replaceLayer } from '../storeHelpers'

export type GridSlice = {
  paintCell: (x: number, y: number, slot: number) => void
  eraseCell: (x: number, y: number) => void
  fillCell: (x: number, y: number, slot: number) => void
  drawLineBetween: (x0: number, y0: number, x1: number, y1: number, slot: number) => void
  /** Clears every cell within the inclusive rectangle (x0,y0)–(x1,y1), in any corner order. */
  clearRegion: (x0: number, y0: number, x1: number, y1: number) => void
  /** Fills every cell within the inclusive rectangle (x0,y0)–(x1,y1) with a given swatch slot. */
  paintRegion: (x0: number, y0: number, x1: number, y1: number, slot: number) => void
  /** Clears an arbitrary, possibly non-rectangular, set of cells — used by the lasso tool. */
  clearCells: (cells: Array<{ x: number; y: number }>) => void
  /** Fills an arbitrary, possibly non-rectangular, set of cells with a given swatch slot. */
  paintCells: (cells: Array<{ x: number; y: number }>, slot: number) => void
}

export const createGridSlice: StateCreator<KnittingStore, [], [], GridSlice> = (set) => ({
  paintCell: (x, y, slot) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return state
      const nextGrid = cloneGrid(layer.grid)
      nextGrid.data[y * nextGrid.width + x] = slot
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),

  eraseCell: (x, y) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return state
      const nextGrid = cloneGrid(layer.grid)
      nextGrid.data[y * nextGrid.width + x] = 0
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),

  fillCell: (x, y, slot) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return state
      return {
        project: replaceLayer(state.project, layer.id, (l) => ({
          ...l,
          grid: floodFill(l.grid, x, y, slot),
        })),
      }
    }),

  drawLineBetween: (x0, y0, x1, y1, slot) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      return {
        project: replaceLayer(state.project, layer.id, (l) => ({
          ...l,
          grid: drawLine(l.grid, x0, y0, x1, y1, slot),
        })),
      }
    }),

  clearRegion: (x0, y0, x1, y1) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      const minX = Math.max(0, Math.min(x0, x1))
      const maxX = Math.min(layer.width - 1, Math.max(x0, x1))
      const minY = Math.max(0, Math.min(y0, y1))
      const maxY = Math.min(layer.height - 1, Math.max(y0, y1))
      const nextGrid = cloneGrid(layer.grid)
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          nextGrid.data[y * nextGrid.width + x] = 0
        }
      }
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),

  paintRegion: (x0, y0, x1, y1, slot) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      const minX = Math.max(0, Math.min(x0, x1))
      const maxX = Math.min(layer.width - 1, Math.max(x0, x1))
      const minY = Math.max(0, Math.min(y0, y1))
      const maxY = Math.min(layer.height - 1, Math.max(y0, y1))
      const nextGrid = cloneGrid(layer.grid)
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          nextGrid.data[y * nextGrid.width + x] = slot
        }
      }
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),

  clearCells: (cells) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      const nextGrid = cloneGrid(layer.grid)
      for (const { x, y } of cells) {
        if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) continue
        nextGrid.data[y * nextGrid.width + x] = 0
      }
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),

  paintCells: (cells, slot) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      const nextGrid = cloneGrid(layer.grid)
      for (const { x, y } of cells) {
        if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) continue
        nextGrid.data[y * nextGrid.width + x] = slot
      }
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),
})
