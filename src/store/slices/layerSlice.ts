// Layers — add/remove/rename/activate, the seam-rounding "connect" pairing
// between two layers, batched resize from the gauge wizard, and the onion
// skin reference-layer setting (a drawing aid, not part of "connection").

import type { StateCreator } from 'zustand'

import { createLayer, resizeRowAnnotations } from '../../domain/project'
import type { KnittingStore, LayerSizeUpdate } from '../types'
import { replaceLayer, resizeGrid, withDerivedSize } from '../storeHelpers'

export type LayerSlice = {
  addLayer: (name: string) => void
  removeLayer: (layerId: string) => void
  renameLayer: (layerId: string, name: string) => void
  setActiveLayerId: (layerId: string) => void
  connectLayers: (aId: string, bId: string) => void
  disconnectLayer: (layerId: string) => void
  applyLayerSizes: (updates: LayerSizeUpdate[]) => void

  // Onion skin — a reference layer rendered faintly beneath the active one.
  // Any layer may be chosen (not just a connected partner) since this is a
  // visual drawing aid, unrelated to the seam-rounding "connection" concept.
  onionSkinEnabled: boolean
  onionSkinLayerId: string | null
  setOnionSkinEnabled: (enabled: boolean) => void
  setOnionSkinLayerId: (layerId: string | null) => void
}

export const createLayerSlice: StateCreator<KnittingStore, [], [], LayerSlice> = (set) => ({
  onionSkinEnabled: false,
  onionSkinLayerId: null,

  addLayer: (name) =>
    set((state) => {
      const id = `layer-${Date.now()}`
      const layer = createLayer(id, name, {
        targetWidthCm: 10,
        targetHeightCm: 10,
        projectGauge: state.project.gauge,
      })
      return {
        project: {
          ...state.project,
          layers: [...state.project.layers, layer],
          activeLayerId: id,
        },
        undoStack: [],
        redoStack: [],
      }
    }),

  removeLayer: (layerId) =>
    set((state) => {
      if (state.project.layers.length <= 1) return state // keep at least one layer

      const remaining = state.project.layers
        .filter((l) => l.id !== layerId)
        // Disconnect anything that pointed at the removed layer
        .map((l) => (l.connectedLayerId === layerId ? { ...l, connectedLayerId: null } : l))

      const activeLayerId =
        state.project.activeLayerId === layerId ? remaining[0].id : state.project.activeLayerId

      // Drop the onion reference if it pointed at the removed layer, or
      // reassign it to another layer if it now matches the active one.
      let onionSkinLayerId = state.onionSkinLayerId === layerId ? null : state.onionSkinLayerId
      if (onionSkinLayerId === activeLayerId) {
        onionSkinLayerId = remaining.find((l) => l.id !== activeLayerId)?.id ?? null
      }

      return {
        project: { ...state.project, layers: remaining, activeLayerId },
        undoStack: [],
        redoStack: [],
        onionSkinLayerId,
      }
    }),

  renameLayer: (layerId, name) =>
    set((state) => ({ project: replaceLayer(state.project, layerId, (l) => ({ ...l, name })) })),

  setActiveLayerId: (layerId) =>
    set((state) => {
      if (!state.project.layers.some((l) => l.id === layerId)) return state
      // A layer can't onion-skin against itself — if the new active layer was
      // the reference, swap to another available layer instead of just
      // nulling it out (which would leave the toolbar dropdown showing a
      // stale selection with no real reference behind it).
      const onionSkinLayerId =
        state.onionSkinLayerId === layerId
          ? (state.project.layers.find((l) => l.id !== layerId)?.id ?? null)
          : state.onionSkinLayerId
      return {
        project: { ...state.project, activeLayerId: layerId },
        undoStack: [],
        redoStack: [],
        onionSkinLayerId,
      }
    }),

  connectLayers: (aId, bId) =>
    set((state) => {
      if (aId === bId) return state
      return {
        project: {
          ...state.project,
          layers: state.project.layers.map((l) => {
            if (l.id === aId) return { ...l, connectedLayerId: bId }
            if (l.id === bId) return { ...l, connectedLayerId: aId }
            // Break any stale link to a layer that's being re-paired elsewhere
            if (l.connectedLayerId === aId || l.connectedLayerId === bId)
              return { ...l, connectedLayerId: null }
            return l
          }),
        },
      }
    }),

  disconnectLayer: (layerId) =>
    set((state) => {
      const layer = state.project.layers.find((l) => l.id === layerId)
      const partnerId = layer?.connectedLayerId ?? null
      return {
        project: {
          ...state.project,
          layers: state.project.layers.map((l) => {
            if (l.id === layerId || (partnerId && l.id === partnerId))
              return { ...l, connectedLayerId: null }
            return l
          }),
        },
      }
    }),

  applyLayerSizes: (updates) =>
    set((state) => {
      let project = state.project
      for (const u of updates) {
        project = replaceLayer(project, u.layerId, (layer) =>
          withDerivedSize(
            {
              ...layer,
              width: u.width,
              height: u.height,
              gaugeOverride: u.gaugeOverride,
              targetWidthCm: u.targetWidthCm,
              targetHeightCm: u.targetHeightCm,
              grid: resizeGrid(layer.grid, u.width, u.height),
              rowAnnotations: resizeRowAnnotations(layer.rowAnnotations, u.height),
            },
            project,
          ),
        )
      }
      return { project, undoStack: [], redoStack: [] }
    }),

  setOnionSkinEnabled: (enabled) => set({ onionSkinEnabled: enabled }),

  setOnionSkinLayerId: (layerId) => set({ onionSkinLayerId: layerId }),
})
