import type { ReactNode } from 'react'

import styles from './EmptyState.module.css'

/** Centered muted placeholder text for empty lists/grids — "No saved
 *  projects yet.", "No colors configured yet.", etc. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>
}
