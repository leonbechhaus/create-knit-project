export type Profile = {
  id: string
  name: string
  createdAt: string
}

export const createProfile = (id: string, name: string): Profile => ({
  id,
  name,
  createdAt: new Date().toISOString(),
})

const STORAGE_KEY = 'knit-lab-profile-id'

export const getStoredProfileId = (): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null

export const storeProfileId = (id: string): void => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id)
}
