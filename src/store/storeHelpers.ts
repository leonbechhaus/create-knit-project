// Pure helpers + seed data shared across store slices: DB-record <-> domain
// mapping, legacy-record migration, and small derived-value calculators.
// Nothing in this file touches Zustand — it's plain, test-friendly logic.

import { createSwatch, type Swatch } from '../domain/color'
import {
  calculateCentimeters,
  createEmptyGrid,
  createEmptyRowAnnotations,
  createLayer,
  deserializeGrid,
  resizeRowAnnotations,
  type GaugeConfig,
  type Grid,
  type Layer,
  type Project,
} from '../domain/project'
import { db, type LayerRecord, type ProjectRecord, type SwatchRecord } from '../db/knitDb'

export const MAX_UNDO = 50
export const BASE_ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]

// ─── Initial data ────────────────────────────────────────────────────────────

export const initialSwatches: Swatch[] = [
  createSwatch('s1', 'Slate', { h: 205, s: 28, l: 48, a: 1 }, 'global', 1),
  createSwatch('s2', 'Rose', { h: 345, s: 70, l: 58, a: 1 }, 'global', 2),
  createSwatch('s3', 'Willow', { h: 90, s: 38, l: 52, a: 1 }, 'global', 3),
  createSwatch('s4', 'Citrus', { h: 42, s: 80, l: 58, a: 1 }, 'global', 4),
  createSwatch('s5', 'Cream', { h: 38, s: 27, l: 92, a: 1 }, 'global', 5),
  createSwatch('s6', 'Ink', { h: 240, s: 24, l: 18, a: 1 }, 'global', 6),
]

export const makeInitialProject = (): Project => {
  const gauge: GaugeConfig = { stitchGauge: 24, rowGauge: 32 }
  const main = createLayer('layer-main', 'Main piece', {
    targetWidthCm: 15,
    targetHeightCm: calculateCentimeters(56, 32),
    projectGauge: gauge,
  })
  return {
    id: 'project-draft',
    name: 'Alpine scarf',
    gauge,
    activeSwatchId: 's1',
    layers: [main],
    activeLayerId: main.id,
  }
}

// ─── Persistence helpers ─────────────────────────────────────────────────────

export const layerToRecord = (layer: Layer): LayerRecord => ({
  id: layer.id,
  name: layer.name,
  gaugeOverride: layer.gaugeOverride,
  targetWidthCm: layer.targetWidthCm,
  targetHeightCm: layer.targetHeightCm,
  cmWidth: layer.cmWidth,
  cmHeight: layer.cmHeight,
  connectedLayerId: layer.connectedLayerId,
  gridData: Array.from(layer.grid.data),
  gridWidth: layer.grid.width,
  gridHeight: layer.grid.height,
  rowAnnotations: layer.rowAnnotations,
})

export const recordToLayer = (record: LayerRecord): Layer => ({
  id: record.id,
  name: record.name,
  width: record.gridWidth,
  height: record.gridHeight,
  gaugeOverride: record.gaugeOverride ?? null,
  targetWidthCm: record.targetWidthCm,
  targetHeightCm: record.targetHeightCm,
  cmWidth: record.cmWidth,
  cmHeight: record.cmHeight,
  connectedLayerId: record.connectedLayerId ?? null,
  grid: deserializeGrid({
    width: record.gridWidth,
    height: record.gridHeight,
    data: record.gridData,
  }),
  // Records saved before this feature existed have no rowAnnotations at all.
  rowAnnotations: resizeRowAnnotations(record.rowAnnotations ?? [], record.gridHeight),
})

/** Migrates pre-layer records (single grid/config per project) into a one-layer project. */
const migrateLegacyRecord = (raw: Record<string, unknown>): Project => {
  const legacyCfg = (raw.config ?? {}) as Record<string, unknown>
  const stitchGauge =
    (raw.gauge as GaugeConfig | undefined)?.stitchGauge ??
    (legacyCfg.stitchGauge as number | undefined) ??
    24
  const rowGauge =
    (raw.gauge as GaugeConfig | undefined)?.rowGauge ??
    (legacyCfg.rowGauge as number | undefined) ??
    32
  const gauge: GaugeConfig = { stitchGauge, rowGauge }

  const gridWidth =
    (raw.gridWidth as number | undefined) ?? (legacyCfg.width as number | undefined) ?? 20
  const gridHeight =
    (raw.gridHeight as number | undefined) ?? (legacyCfg.height as number | undefined) ?? 20
  const gridData = (raw.gridData as number[] | undefined) ?? []
  const targetWidthCm =
    (legacyCfg.targetWidthCm as number | undefined) ?? calculateCentimeters(gridWidth, stitchGauge)
  const targetHeightCm =
    (legacyCfg.targetHeightCm as number | undefined) ?? calculateCentimeters(gridHeight, rowGauge)

  const mainLayer: Layer = {
    id: 'layer-main',
    name: 'Main piece',
    width: gridWidth,
    height: gridHeight,
    gaugeOverride: null,
    targetWidthCm,
    targetHeightCm,
    cmWidth: calculateCentimeters(gridWidth, stitchGauge),
    cmHeight: calculateCentimeters(gridHeight, rowGauge),
    connectedLayerId: null,
    grid: deserializeGrid({ width: gridWidth, height: gridHeight, data: gridData }),
    rowAnnotations: createEmptyRowAnnotations(gridHeight),
  }

  return {
    id: raw.id as string,
    name: raw.name as string,
    gauge,
    activeSwatchId: (raw.activeSwatchId as string | null) ?? null,
    layers: [mainLayer],
    activeLayerId: mainLayer.id,
  }
}

export const recordToProject = (record: ProjectRecord): Project => {
  if (!Array.isArray(record.layers) || record.layers.length === 0) {
    return migrateLegacyRecord(record as unknown as Record<string, unknown>)
  }
  return {
    id: record.id,
    name: record.name,
    gauge: record.gauge ?? { stitchGauge: 24, rowGauge: 32 },
    activeSwatchId: record.activeSwatchId,
    layers: record.layers.map(recordToLayer),
    activeLayerId: record.layers.some((l) => l.id === record.activeLayerId)
      ? record.activeLayerId
      : record.layers[0].id,
  }
}

export const swatchToRecord = (swatch: Swatch, profileId: string): SwatchRecord => ({
  ...swatch,
  profileId,
  createdAt: new Date().toISOString(),
})

/** Global swatches are shared across every project in the profile. */
export const loadGlobalSwatches = async (profileId: string): Promise<Swatch[]> =>
  (await db.swatches.where({ profileId, category: 'global' }).toArray()).sort(
    (a, b) => a.slot - b.slot,
  )

/** Project swatches only ever apply while their owning project is active. */
export const loadProjectSwatches = async (
  profileId: string,
  projectId: string,
): Promise<Swatch[]> =>
  (await db.swatches.where({ profileId, category: 'project', projectId }).toArray()).sort(
    (a, b) => a.slot - b.slot,
  )

/** Recompute a layer's derived cm dimensions after an edit. */
export const withDerivedSize = (layer: Layer, project: Project): Layer => {
  const gauge = layer.gaugeOverride ?? project.gauge
  return {
    ...layer,
    cmWidth: calculateCentimeters(layer.width, gauge.stitchGauge),
    cmHeight: calculateCentimeters(layer.height, gauge.rowGauge),
  }
}

/** Resize a layer's grid, preserving overlapping existing cell data. */
export const resizeGrid = (old: Grid, width: number, height: number): Grid => {
  const next = createEmptyGrid(width, height)
  const copyW = Math.min(width, old.width)
  const copyH = Math.min(height, old.height)
  for (let y = 0; y < copyH; y++) {
    for (let x = 0; x < copyW; x++) {
      next.data[y * width + x] = old.data[y * old.width + x]
    }
  }
  return next
}

/** Replace one layer in a project's layer array by id. */
export const replaceLayer = (
  project: Project,
  layerId: string,
  updater: (layer: Layer) => Layer,
): Project => ({
  ...project,
  layers: project.layers.map((l) => (l.id === layerId ? updater(l) : l)),
})
