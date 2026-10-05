// Profile — the single local "account" everything else (projects, global
// swatches, pattern units) is scoped under. There's no auth; a profile id is
// generated once and persisted in localStorage (see domain/profile.ts).

import type { StateCreator } from 'zustand'

import { createProfile, getStoredProfileId, storeProfileId } from '../../domain/profile'
import { db } from '../../db/knitDb'
import type { KnittingStore } from '../types'
import {
  initialSwatches,
  loadGlobalSwatches,
  loadProjectSwatches,
  swatchToRecord,
} from '../storeHelpers'

export type ProfileSlice = {
  profileId: string | null
  initProfile: () => Promise<void>
}

export const createProfileSlice: StateCreator<KnittingStore, [], [], ProfileSlice> = (
  set,
  get,
) => ({
  profileId: null,

  initProfile: async () => {
    await db.open()
    let id = getStoredProfileId()

    if (id) {
      const existing = await db.profiles.get(id)
      if (!existing) id = null
    }

    if (!id) {
      id = `profile-${Date.now()}`
      await db.profiles.put(createProfile(id, 'My Profile'))
      storeProfileId(id)
    }

    set({ profileId: id })
    await get().loadSavedProjects()

    // Seed the profile's global swatches on first run, then merge in any
    // swatches already scoped to the current (possibly still-unsaved) draft
    // project — mirrors the merge done in setActiveProject/createNewProject.
    let globals = await loadGlobalSwatches(id)
    if (globals.length === 0) {
      const seeded = initialSwatches.map((s) => swatchToRecord(s, id))
      await db.swatches.bulkPut(seeded)
      globals = seeded
    }
    const projectSwatches = await loadProjectSwatches(id, get().project.id)
    const merged = [...globals, ...projectSwatches]
    set({
      swatches: merged,
      selectedSwatchId: merged.some((s) => s.id === get().selectedSwatchId)
        ? get().selectedSwatchId
        : (merged[0]?.id ?? null),
    })

    // Pattern Units are scoped per profile only — no project merge needed,
    // unlike swatches, since they never belong to a single project.
    const patternUnits = (await db.patternUnits.where('profileId').equals(id).toArray()).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt),
    )
    set({ patternUnits })
  },
})
