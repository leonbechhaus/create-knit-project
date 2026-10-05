import { createContext, useContext, type InputHTMLAttributes, type ReactNode } from 'react'

import styles from './EntityRow.module.css'

type EntityRowContextValue = { active: boolean }
const EntityRowContext = createContext<EntityRowContextValue>({ active: false })

/**
 * The one selectable-list-row layout used by Layers, Pattern Units, and the
 * project library: a left accent indicator that lights up when active, an
 * optional leading slot (icon/thumbnail), a name+meta body that can swap to
 * an inline rename input, and a trailing actions slot. Compose only the
 * pieces a given row needs.
 *
 * @example
 * <EntityRow active={isActive}>
 *   <EntityRow.Main onClick={onSelect}>
 *     <EntityRow.Body>
 *       <EntityRow.Name>{layer.name}</EntityRow.Name>
 *       <EntityRow.Meta>{layer.width} × {layer.height} st</EntityRow.Meta>
 *     </EntityRow.Body>
 *   </EntityRow.Main>
 *   <EntityRow.Actions>
 *     <IconButton onClick={onRename}><LuPencil /></IconButton>
 *   </EntityRow.Actions>
 * </EntityRow>
 */
export function EntityRow({ active = false, children }: { active?: boolean; children: ReactNode }) {
  return (
    <EntityRowContext.Provider value={{ active }}>
      <div className={`${styles.row} ${active ? styles.rowActive : ''}`}>{children}</div>
    </EntityRowContext.Provider>
  )
}

EntityRow.Main = function EntityRowMain({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={styles.rowMain} onClick={onClick}>
      <div className={styles.rowIndicator} />
      {children}
    </button>
  )
}

EntityRow.Leading = function EntityRowLeading({ children }: { children: ReactNode }) {
  return <>{children}</>
}

EntityRow.Body = function EntityRowBody({ children }: { children: ReactNode }) {
  return <div className={styles.rowBody}>{children}</div>
}

EntityRow.Name = function EntityRowName({ children }: { children: ReactNode }) {
  return <span className={styles.rowName}>{children}</span>
}

EntityRow.Meta = function EntityRowMeta({ children }: { children: ReactNode }) {
  return <span className={styles.rowMeta}>{children}</span>
}

EntityRow.Badge = function EntityRowBadge({ children }: { children: ReactNode }) {
  return <em className={styles.rowBadge}>{children}</em>
}

/** Inline rename input — same boxed/boldened look wherever a row name
 *  becomes editable. Consumer owns the text/commit/cancel state. */
EntityRow.RenameInput = function EntityRowRenameInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  return <input autoFocus className={styles.renameInput} {...props} />
}

EntityRow.Actions = function EntityRowActions({ children }: { children: ReactNode }) {
  return <div className={styles.rowActions}>{children}</div>
}

/** Access the row's active state from a deeply-composed child, e.g. to show
 *  an "active stamp" icon only while selected. */
export function useEntityRowActive() {
  return useContext(EntityRowContext).active
}
