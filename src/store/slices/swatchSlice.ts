// Swatches — the active palette (HSLA colors) available to paint with.
// Each swatch is either "global" (shared across every project in the
// profile) or "project" (scoped to whichever project is currently open).

import type { StateCreator } from 'zustand'

import { createSwatch, nextSwatchSlot, type HSLColor, type Swatch } from '../../domain/color'
import { db } from '../../db/knitDb'
import type { KnittingStore } from '../types'
import { initialSwatches, swatchToRecord } from '../storeHelpers'

export type SwatchSlice = {
  swatches: Swatch[]
  selectedSwatchId: string | null
  setSelectedSwatchId: (id: string | null) => void
  updateSwatch: (swatchId: string, nextColor: HSLColor) => void
  renameSwatch: (swatchId: string, name: string) => void
  setSwatchCategory: (swatchId: string, category: Swatch['category']) => void
  addSwatch: (name: string, color: HSLColor, category: Swatch['category']) => void
}

export const createSwatchSlice: StateCreator<KnittingStore, [], [], SwatchSlice> = (set) => ({
  swatches: initialSwatches,
  selectedSwatchId: 's1',

  setSelectedSwatchId: (id) =>
    set((state) => ({
      selectedSwatchId: id,
      project: { ...state.project, activeSwatchId: id },
    })),

  updateSwatch: (swatchId, nextColor) =>
    set((state) => {
      const swatches = state.swatches.map((s) =>
        s.id === swatchId ? { ...s, color: nextColor } : s,
      )
      const updated = swatches.find((s) => s.id === swatchId)
      if (updated && state.profileId) void db.swatches.put(swatchToRecord(updated, state.profileId))
      return { swatches }
    }),

  renameSwatch: (swatchId, name) =>
    set((state) => {
      const trimmed = name.trim()
      if (!trimmed) return state
      const swatches = state.swatches.map((s) => (s.id === swatchId ? { ...s, name: trimmed } : s))
      const updated = swatches.find((s) => s.id === swatchId)
      if (updated && state.profileId) void db.swatches.put(swatchToRecord(updated, state.profileId))
      return { swatches }
    }),

  setSwatchCategory: (swatchId, category) =>
    set((state) => {
      const swatches = state.swatches.map((s) =>
        s.id === swatchId
          ? { ...s, category, projectId: category === 'project' ? state.project.id : null }
          : s,
      )
      const updated = swatches.find((s) => s.id === swatchId)
      if (updated && state.profileId) void db.swatches.put(swatchToRecord(updated, state.profileId))
      return { swatches }
    }),

  addSwatch: (name, color, category) =>
    set((state) => {
      const slot = nextSwatchSlot(state.swatches)
      const id = `s-${Date.now()}`
      const projectId = category === 'project' ? state.project.id : null
      const swatch = createSwatch(id, name, color, category, slot, projectId)
      if (state.profileId) void db.swatches.put(swatchToRecord(swatch, state.profileId))
      return {
        swatches: [...state.swatches, swatch],
        selectedSwatchId: id,
        project: { ...state.project, activeSwatchId: id },
      }
    }),
})
