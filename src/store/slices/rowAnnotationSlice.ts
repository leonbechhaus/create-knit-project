// Row annotations — chart symbols + notes shown beside the row ruler.
// Intentionally outside the undo/redo stack, same as layer resize/connect.

import type { StateCreator } from 'zustand'

import { getActiveLayer } from '../../domain/project'
import type { KnittingStore } from '../types'
import { replaceLayer } from '../storeHelpers'

export type RowAnnotationSlice = {
  addRowIcon: (rowIndex: number, symbolId: string) => void
  removeRowIcon: (rowIndex: number, iconIndex: number) => void
  setRowNote: (rowIndex: number, note: string) => void
}

export const createRowAnnotationSlice: StateCreator<KnittingStore, [], [], RowAnnotationSlice> = (
  set,
) => ({
  addRowIcon: (rowIndex, symbolId) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer || rowIndex < 0 || rowIndex >= layer.rowAnnotations.length) return state
      const rowAnnotations = layer.rowAnnotations.map((row, y) =>
        y === rowIndex ? { ...row, icons: [...row.icons, symbolId] } : row,
      )
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, rowAnnotations })) }
    }),

  removeRowIcon: (rowIndex, iconIndex) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer || rowIndex < 0 || rowIndex >= layer.rowAnnotations.length) return state
      const rowAnnotations = layer.rowAnnotations.map((row, y) =>
        y === rowIndex ? { ...row, icons: row.icons.filter((_, i) => i !== iconIndex) } : row,
      )
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, rowAnnotations })) }
    }),

  setRowNote: (rowIndex, note) =>
    set((state) => {
      const layer = getActiveLayer(state.project)
      if (!layer || rowIndex < 0 || rowIndex >= layer.rowAnnotations.length) return state
      const rowAnnotations = layer.rowAnnotations.map((row, y) =>
        y === rowIndex ? { ...row, note } : row,
      )
      return { project: replaceLayer(state.project, layer.id, (l) => ({ ...l, rowAnnotations })) }
    }),
})
