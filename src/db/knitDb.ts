import Dexie, { type Table } from 'dexie'

import type { Swatch } from '../domain/color'
import type { PatternUnit } from '../domain/patternUnit'
import type { Profile } from '../domain/profile'
import type { GaugeConfig, RowAnnotation } from '../domain/project'

/** Stored layer — grid data serialised as plain number[] for safe IndexedDB round-trip. */
export type LayerRecord = {
  id: string
  name: string
  gaugeOverride: GaugeConfig | null
  targetWidthCm: number
  targetHeightCm: number
  cmWidth: number
  cmHeight: number
  connectedLayerId: string | null
  gridData: number[]
  gridWidth: number
  gridHeight: number
  /** Optional for backward compatibility with records saved before this
   *  feature existed — missing/undefined is treated as "no annotations yet". */
  rowAnnotations?: RowAnnotation[]
}

/** Stored project — a project is a conglomerate of layers (front/back/sleeve/…). */
export type ProjectRecord = {
  id: string
  profileId: string
  name: string
  gauge: GaugeConfig
  activeSwatchId: string | null
  activeLayerId: string
  layers: LayerRecord[]
  createdAt: string
  updatedAt: string
}

export type SwatchRecord = Swatch & {
  profileId: string
  createdAt: string
}

/** Stored Pattern Unit — already fully JSON-serializable (unlike a layer's
 *  grid, it has no typed array to flatten), so the record is identical to
 *  the domain type. */
export type PatternUnitRecord = PatternUnit

class KnitDb extends Dexie {
  profiles!: Table<Profile, string>
  projects!: Table<ProjectRecord, string>
  swatches!: Table<SwatchRecord, string>
  patternUnits!: Table<PatternUnitRecord, string>

  constructor() {
    super('knit-lab-db')

    this.version(2).stores({
      profiles: 'id, name, createdAt',
      projects: 'id, profileId, updatedAt',
      swatches: 'id, profileId, category',
    })

    // v3 — swatches gained `projectId` (scopes a 'project'-category swatch to
    // the project that created it; `null` for 'global' ones).
    this.version(3).stores({
      profiles: 'id, name, createdAt',
      projects: 'id, profileId, updatedAt',
      swatches: 'id, profileId, category, projectId',
    })

    // v4 — compound indexes matching the exact {profileId, category[,
    // projectId]} queries used to load a profile's global swatches and a
    // project's scoped ones, replacing the separate single-column indexes.
    this.version(4).stores({
      profiles: 'id, name, createdAt',
      projects: 'id, profileId, updatedAt',
      swatches: 'id, [profileId+category], [profileId+category+projectId]',
    })

    // v5 — Pattern Units: reusable stitch motifs captured from a selection,
    // scoped per profile (not per project) same as global swatches.
    this.version(5).stores({
      profiles: 'id, name, createdAt',
      projects: 'id, profileId, updatedAt',
      swatches: 'id, [profileId+category], [profileId+category+projectId]',
      patternUnits: 'id, profileId, createdAt',
    })
  }
}

export const db = new KnitDb()
