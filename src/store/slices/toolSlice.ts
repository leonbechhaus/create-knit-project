// Tool — the active drawing tool, canvas zoom level, and the row-ruler flip
// (row 1 at bottom vs. top). All simple, independent pieces of UI state.

import type { StateCreator } from 'zustand'

import type { ToolKind } from '../../domain/project'
import type { KnittingStore } from '../types'
import { BASE_ZOOM_STEPS } from '../storeHelpers'

export type ToolSlice = {
  activeTool: ToolKind
  setActiveTool: (tool: ToolKind) => void

  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  flipY: boolean
  setFlipY: (flip: boolean) => void
}

export const createToolSlice: StateCreator<KnittingStore, [], [], ToolSlice> = (set) => ({
  activeTool: 'paint',
  zoom: 1,
  flipY: false,

  setActiveTool: (tool) => set({ activeTool: tool }),

  zoomIn: () =>
    set((state) => {
      const idx = BASE_ZOOM_STEPS.findIndex((z) => z > state.zoom)
      return { zoom: idx >= 0 ? BASE_ZOOM_STEPS[idx] : state.zoom }
    }),

  zoomOut: () =>
    set((state) => {
      const idx = [...BASE_ZOOM_STEPS].reverse().findIndex((z) => z < state.zoom)
      const steps = [...BASE_ZOOM_STEPS].reverse()
      return { zoom: idx >= 0 ? steps[idx] : state.zoom }
    }),

  resetZoom: () => set({ zoom: 1 }),

  setFlipY: (flip) => set({ flipY: flip }),
})
