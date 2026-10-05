// The single app store, assembled from focused slices (see ./slices) using
// Zustand's "slices pattern": one store, one `set`/`get`, one hook — just
// split across files by concern instead of living in one giant object.
// Add new domains as a new slice file + one line here, not more state here.

import { create } from 'zustand'

import { createGridSlice } from './slices/gridSlice'
import { createHistorySlice } from './slices/historySlice'
import { createLayerSlice } from './slices/layerSlice'
import { createPatternUnitSlice } from './slices/patternUnitSlice'
import { createProfileSlice } from './slices/profileSlice'
import { createProjectSlice } from './slices/projectSlice'
import { createRowAnnotationSlice } from './slices/rowAnnotationSlice'
import { createSwatchSlice } from './slices/swatchSlice'
import { createToolSlice } from './slices/toolSlice'
import type { KnittingStore } from './types'

export type { KnittingStore, LayerSizeUpdate } from './types'

export const useKnittingStore = create<KnittingStore>()((...a) => ({
  ...createProfileSlice(...a),
  ...createProjectSlice(...a),
  ...createSwatchSlice(...a),
  ...createPatternUnitSlice(...a),
  ...createLayerSlice(...a),
  ...createToolSlice(...a),
  ...createHistorySlice(...a),
  ...createGridSlice(...a),
  ...createRowAnnotationSlice(...a),
}))
