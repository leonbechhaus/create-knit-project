import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LuChevronRight, LuPaintBucket, LuStamp, LuTrash2 } from 'react-icons/lu'

import appStyles from '../../App.module.css'
import type { Swatch } from '../../domain/color'
import { ColorSwatch } from './ColorSwatch'
import styles from './SelectionContextMenu.module.css'

type Point = { x: number; y: number }

type SelectionContextMenuProps = {
  /** Position relative to the grid area (same coordinate space as the
   *  canvas content) to anchor the menu at — typically just outside the
   *  selection's corner. */
  position: Point
  /** Every color available to paint with — global swatches plus this project's own. */
  swatches: Swatch[]
  onPickColor: (slot: number) => void
  onClear: () => void
  /** Captures the current selection into a new, named Pattern Unit. */
  onSaveAsPattern: (name: string) => void
  onClose: () => void
}

/** Context menu for an active selection: fill it with any configured color,
 *  capture it as a reusable Pattern Unit, or clear it outright. Opens
 *  automatically next to the selection and stays anchored to it as the grid
 *  scrolls, since it shares the grid's own coordinate space rather than the
 *  viewport. */
export function SelectionContextMenu({
  position,
  swatches,
  onPickColor,
  onClear,
  onSaveAsPattern,
  onClose,
}: SelectionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)

  // Only one fly-out (color picker or the pattern-naming form) can be open
  // at a time — they share one measured position, same "attach beside the
  // whole menu panel" treatment as a native OS submenu.
  const [submenuKind, setSubmenuKind] = useState<'color' | 'pattern' | null>(null)
  const [submenuPos, setSubmenuPos] = useState<Point | null>(null)
  const [patternName, setPatternName] = useState('New pattern')

  useLayoutEffect(() => {
    if (!submenuKind) {
      setSubmenuPos(null)
      return
    }
    const menuEl = menuRef.current
    if (!menuEl) return
    const menuRect = menuEl.getBoundingClientRect()
    const subRect = submenuRef.current?.getBoundingClientRect()
    const subWidth = subRect?.width ?? 220
    const subHeight = subRect?.height ?? 160

    let x = menuRect.right + 6
    if (x + subWidth > window.innerWidth - 8) x = menuRect.left - subWidth - 6
    let y = menuRect.top
    if (y + subHeight > window.innerHeight - 8) y = window.innerHeight - subHeight - 8

    setSubmenuPos({ x: Math.max(8, x), y: Math.max(8, y) })
  }, [submenuKind])

  // Dismiss on outside click or Escape — ignore clicks on either panel itself.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if (submenuRef.current?.contains(target)) return
      onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const openPatternForm = () => {
    setPatternName('New pattern')
    setSubmenuKind((k) => (k === 'pattern' ? null : 'pattern'))
  }

  const commitPatternForm = () => {
    const trimmed = patternName.trim()
    if (!trimmed) return
    onSaveAsPattern(trimmed)
    onClose()
  }

  return (
    <>
      <div ref={menuRef} className={styles.menu} style={{ left: position.x, top: position.y }}>
        <button
          type="button"
          className={styles.item}
          onClick={() => setSubmenuKind((k) => (k === 'color' ? null : 'color'))}
        >
          <LuPaintBucket size={14} strokeWidth={2} />
          Fill with color
          <LuChevronRight size={13} strokeWidth={2} className={styles.chevron} />
        </button>
        <button type="button" className={styles.item} onClick={openPatternForm}>
          <LuStamp size={14} strokeWidth={2} />
          Save as pattern unit
          <LuChevronRight size={13} strokeWidth={2} className={styles.chevron} />
        </button>
        <div className={styles.divider} />
        <button
          type="button"
          className={`${styles.item} ${styles.itemDanger}`}
          onClick={() => {
            onClear()
            onClose()
          }}
        >
          <LuTrash2 size={14} strokeWidth={2} />
          Clear selection
        </button>
      </div>

      {submenuKind && (
        <div
          ref={submenuRef}
          className={styles.submenu}
          style={
            submenuPos
              ? { left: submenuPos.x, top: submenuPos.y }
              : { left: -9999, top: -9999, visibility: 'hidden' } // measure off-screen first frame
          }
        >
          {submenuKind === 'color' ? (
            <>
              <div className={appStyles.eyebrow}>Choose a color</div>
              <div className={styles.submenuDivider} />
              {swatches.length === 0 ? (
                <div className={styles.empty}>No colors configured yet.</div>
              ) : (
                <div className={styles.swatchGrid}>
                  {swatches.map((swatch) => (
                    <ColorSwatch
                      key={swatch.id}
                      swatch={swatch}
                      size="compact"
                      onClick={() => {
                        onPickColor(swatch.slot)
                        onClose()
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className={appStyles.eyebrow}>Save as pattern unit</div>
              <div className={styles.submenuDivider} />
              <form
                className={styles.patternForm}
                onSubmit={(e) => {
                  e.preventDefault()
                  commitPatternForm()
                }}
              >
                <input
                  autoFocus
                  className={styles.patternInput}
                  value={patternName}
                  onChange={(e) => setPatternName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSubmenuKind(null)
                  }}
                />
                <button
                  type="submit"
                  className={styles.patternSaveBtn}
                  disabled={!patternName.trim()}
                >
                  Save
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
