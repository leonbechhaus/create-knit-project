// Full store shape, assembled from each slice's own state+action interface.
// Keeping this composition in one place means every slice creator can be
// typed as `StateCreator<KnittingStore, [], [], ThatSlice>` — giving each
// slice's `set`/`get` full visibility into the other slices' state without
// the slice files needing to import each other directly.

import type { GaugeConfig } from '../domain/project'
import type { ProfileSlice } from './slices/profileSlice'
import type { ProjectSlice } from './slices/projectSlice'
import type { SwatchSlice } from './slices/swatchSlice'
import type { PatternUnitSlice } from './slices/patternUnitSlice'
import type { LayerSlice } from './slices/layerSlice'
import type { ToolSlice } from './slices/toolSlice'
import type { HistorySlice } from './slices/historySlice'
import type { GridSlice } from './slices/gridSlice'
import type { RowAnnotationSlice } from './slices/rowAnnotationSlice'

/** Result of a (possibly joint) gauge-wizard calculation, applied atomically. */
export type LayerSizeUpdate = {
  layerId: string
  width: number
  height: number
  gaugeOverride: GaugeConfig | null
  targetWidthCm: number
  targetHeightCm: number
}

export type KnittingStore = ProfileSlice &
  ProjectSlice &
  SwatchSlice &
  PatternUnitSlice &
  LayerSlice &
  ToolSlice &
  HistorySlice &
  GridSlice &
  RowAnnotationSlice
