// Pattern Units — reusable stitch motifs captured from a selection, scoped
// per profile (shared across every project), stamped back down with the
// Stamp tool.

import type { StateCreator } from 'zustand'

import { buildPatternUnit, placePatternCells, type PatternUnit } from '../../domain/patternUnit'
import { cloneGrid, getActiveLayer } from '../../domain/project'
import { db } from '../../db/knitDb'
import type { KnittingStore } from '../types'
import { replaceLayer } from '../storeHelpers'

export type PatternUnitSlice = {
  patternUnits: PatternUnit[]
  activePatternUnitId: string | null
  setActivePatternUnitId: (id: string | null) => void
  /** Captures a raw (grid-space cell + slot) selection into a new, named
   *  Pattern Unit and makes it the active one. */
  savePatternUnit: (name: string, rawCells: Array<{ x: number; y: number; slot: number }>) => void
  renamePatternUnit: (id: string, name: string) => void
  deletePatternUnit: (id: string) => void
  /** Stamps the active Pattern Unit onto the active layer, centered at (centerX, centerY). */
  stampPattern: (centerX: number, centerY: number) => void
}

export const createPatternUnitSlice: StateCreator<KnittingStore, [], [], PatternUnitSlice> = (
  set,
) => ({
  patternUnits: [],
  activePatternUnitId: null,

  setActivePatternUnitId: (id) => set({ activePatternUnitId: id }),

  savePatternUnit: (name, rawCells) =>
    set((state) => {
      if (!state.profileId) return state
      const unit = buildPatternUnit(
        `pattern-${Date.now()}`,
        state.profileId,
        name,
        rawCells,
        state.swatches,
      )
      if (!unit) return state
      void db.patternUnits.put(unit)
      // Immediately active so the user can switch straight to the Stamp
      // tool and start placing it.
      return { patternUnits: [...state.patternUnits, unit], activePatternUnitId: unit.id }
    }),

  renamePatternUnit: (id, name) =>
    set((state) => {
      const patternUnits = state.patternUnits.map((p) => (p.id === id ? { ...p, name } : p))
      const updated = patternUnits.find((p) => p.id === id)
      if (updated) void db.patternUnits.put(updated)
      return { patternUnits }
    }),

  deletePatternUnit: (id) =>
    set((state) => {
      void db.patternUnits.delete(id)
      return {
        patternUnits: state.patternUnits.filter((p) => p.id !== id),
        activePatternUnitId: state.activePatternUnitId === id ? null : state.activePatternUnitId,
      }
    }),

  stampPattern: (centerX, centerY) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      const unit = state.patternUnits.find((p) => p.id === state.activePatternUnitId)
      if (!layer || !unit) return state
      const nextGrid = cloneGrid(layer.grid)
      for (const { x, y, slot } of placePatternCells(unit, centerX, centerY, state.swatches)) {
        if (slot === null) continue // unresolved swatch reference — leave untouched, not cleared
        if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) continue
        nextGrid.data[y * nextGrid.width + x] = slot
      }
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: nextGrid })) }
    }),
})
