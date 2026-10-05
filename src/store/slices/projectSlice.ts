// Project — the active project document (name, gauge, layers) plus the
// profile's saved-project list in IndexedDB. Owns load/save/create, and the
// project-wide default gauge editor.

import type { StateCreator } from 'zustand'

import { createLayer, type GaugeConfig, type Project } from '../../domain/project'
import { db, type ProjectRecord } from '../../db/knitDb'
import type { KnittingStore } from '../types'
import {
  layerToRecord,
  loadProjectSwatches,
  makeInitialProject,
  recordToProject,
} from '../storeHelpers'

export type ProjectSlice = {
  project: Project
  savedProjects: ProjectRecord[]
  loadSavedProjects: () => Promise<void>
  setActiveProject: (record: ProjectRecord) => void
  saveProject: () => Promise<void>
  createNewProject: (
    name: string,
    gauge: GaugeConfig,
    firstLayer: { targetWidthCm: number; targetHeightCm: number },
  ) => void

  // Project-wide gauge default
  updateProjectGauge: (partial: Partial<GaugeConfig>) => void
}

export const createProjectSlice: StateCreator<KnittingStore, [], [], ProjectSlice> = (
  set,
  get,
) => ({
  project: makeInitialProject(),
  savedProjects: [],

  loadSavedProjects: async () => {
    const { profileId } = get()
    if (!profileId) return

    const records = await db.projects
      .where('profileId')
      .equals(profileId)
      .reverse()
      .sortBy('updatedAt')

    set({ savedProjects: records })
  },

  setActiveProject: (record) => {
    const project = recordToProject(record)
    set((state) => ({
      project,
      selectedSwatchId: project.activeSwatchId,
      // Drop the previous project's scoped swatches right away so a stale
      // palette never flashes — the new project's own ones are merged back
      // in once loaded, just below. Global swatches are unaffected.
      swatches: state.swatches.filter((s) => s.category === 'global'),
      undoStack: [],
      redoStack: [],
      onionSkinEnabled: false,
      onionSkinLayerId: null,
    }))

    const { profileId } = get()
    if (!profileId) return
    void loadProjectSwatches(profileId, project.id).then((projectSwatches) => {
      if (get().project.id !== project.id) return // a newer switch has since happened
      set((state) => ({ swatches: [...state.swatches, ...projectSwatches] }))
    })
  },

  saveProject: async () => {
    const { project, profileId } = get()
    if (!profileId) return

    const now = new Date().toISOString()

    const record: ProjectRecord = {
      id: project.id,
      profileId,
      name: project.name,
      gauge: project.gauge,
      activeSwatchId: project.activeSwatchId,
      activeLayerId: project.activeLayerId,
      layers: project.layers.map(layerToRecord),
      createdAt: now,
      updatedAt: now,
    }

    await db.projects.put(record)
    await get().loadSavedProjects()
  },

  createNewProject: (name, gauge, firstLayer) => {
    const main = createLayer('layer-main', 'Main piece', {
      targetWidthCm: firstLayer.targetWidthCm,
      targetHeightCm: firstLayer.targetHeightCm,
      projectGauge: gauge,
    })

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      gauge,
      activeSwatchId: 's1',
      layers: [main],
      activeLayerId: main.id,
    }

    set((state) => ({
      project: newProject,
      selectedSwatchId: 's1',
      // A brand-new project has no project-scoped swatches of its own yet —
      // only the globals carry over.
      swatches: state.swatches.filter((s) => s.category === 'global'),
      undoStack: [],
      redoStack: [],
      onionSkinEnabled: false,
      onionSkinLayerId: null,
    }))

    setTimeout(() => void get().saveProject(), 0)
  },

  updateProjectGauge: (partial) =>
    set((state) => ({
      project: {
        ...state.project,
        gauge: { ...state.project.gauge, ...partial },
      },
    })),
})
