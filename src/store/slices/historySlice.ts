// History — undo/redo, scoped to the active layer's grid. A snapshot is
// pushed once per gesture via beginStroke (called before the first mutation
// of a stroke/fill/line/etc.), not per individual cell change.

import type { StateCreator } from 'zustand'

import { cloneGrid, getActiveLayer, type Grid } from '../../domain/project'
import type { KnittingStore } from '../types'
import { MAX_UNDO, replaceLayer } from '../storeHelpers'

export type HistorySlice = {
  undoStack: Grid[]
  redoStack: Grid[]
  beginStroke: () => void
  undo: () => void
  redo: () => void
}

export const createHistorySlice: StateCreator<KnittingStore, [], [], HistorySlice> = (set) => ({
  undoStack: [],
  redoStack: [],

  beginStroke: () =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      return {
        undoStack: [...state.undoStack.slice(-(MAX_UNDO - 1)), cloneGrid(layer.grid)],
        redoStack: [],
      }
    }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      const prev = state.undoStack[state.undoStack.length - 1]
      return {
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, cloneGrid(layer.grid)],
        project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: prev })),
      }
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return state
      const layer = getActiveLayer(state.project)
      if (!layer) return state
      const next = state.redoStack[state.redoStack.length - 1]
      return {
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, cloneGrid(layer.grid)],
        project: replaceLayer(state.project, layer.id, (l) => ({ ...l, grid: next })),
      }
    }),
})
