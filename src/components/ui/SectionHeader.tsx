import type { ReactNode } from 'react'

import styles from './SectionHeader.module.css'

/**
 * The eyebrow(+title)+action header row repeated at the top of every panel
 * and list section — "Projects" + New button, "Color"/"Studio" + close
 * button, etc. Compose only the pieces a given header needs.
 *
 * @example
 * // Single-line eyebrow + trailing action (list section header)
 * <SectionHeader>
 *   <SectionHeader.Eyebrow>Projects</SectionHeader.Eyebrow>
 *   <SectionHeader.Actions>
 *     <Button variant="outline" size="sm" icon={<LuPlus />}>New</Button>
 *   </SectionHeader.Actions>
 * </SectionHeader>
 *
 * // Two-line eyebrow + title + close button (offcanvas panel head)
 * <SectionHeader>
 *   <SectionHeader.Heading>
 *     <SectionHeader.Eyebrow>Color</SectionHeader.Eyebrow>
 *     <SectionHeader.Title>Studio</SectionHeader.Title>
 *   </SectionHeader.Heading>
 *   <SectionHeader.Actions>
 *     <IconButton onClick={onClose}><LuX /></IconButton>
 *   </SectionHeader.Actions>
 * </SectionHeader>
 */
export function SectionHeader({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>
}

SectionHeader.Heading = function SectionHeaderHeading({ children }: { children: ReactNode }) {
  return <div className={styles.heading}>{children}</div>
}

SectionHeader.Eyebrow = function SectionHeaderEyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>
}

SectionHeader.Title = function SectionHeaderTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>
}

SectionHeader.Actions = function SectionHeaderActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
