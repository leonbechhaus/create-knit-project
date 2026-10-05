import { useEffect, useRef, useState } from 'react'
import { LuInfo } from 'react-icons/lu'

import appStyles from '../../App.module.css'
import { STITCH_SYMBOLS } from '../../domain/symbols'
import { IconButton } from './IconButton'
import styles from './IconSymbolPicker.module.css'
import { SymbolLegendModal } from './SymbolLegendModal'

type Point = { x: number; y: number }

type IconSymbolPickerProps = {
  /** Fixed-position anchor (viewport coordinates), typically just beside the
   *  "+" button that opened this picker. */
  position: Point
  onPick: (symbolId: string) => void
  onClose: () => void
}

/** Flyout grid of every available stitch-chart symbol — same panel language
 *  (eyebrow + divider + grid) as the selection context menu's color flyout,
 *  so picking an icon feels like the same family of UI as picking a color. */
export function IconSymbolPicker({ position, onPick, onClose }: IconSymbolPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (legendOpen) return // the legend modal has its own backdrop/close handling
      if (panelRef.current?.contains(e.target as Node)) return
      onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (legendOpen) setLegendOpen(false)
      else onClose()
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, legendOpen])

  return (
    <div ref={panelRef} className={styles.panel} style={{ left: position.x, top: position.y }}>
      <div className={styles.header}>
        <div className={appStyles.eyebrow}>Choose a symbol</div>
        <IconButton
          size="sm"
          aria-label="Open symbol legend"
          title="What do these symbols mean?"
          onClick={() => setLegendOpen(true)}
        >
          <LuInfo size={14} strokeWidth={2} />
        </IconButton>
      </div>
      <div className={styles.divider} />
      <div className={styles.symbolGrid}>
        {STITCH_SYMBOLS.map((symbol) => (
          <button
            key={symbol.id}
            type="button"
            className={styles.symbolButton}
            title={symbol.label}
            aria-label={symbol.label}
            onClick={() => {
              onPick(symbol.id)
              onClose()
            }}
          >
            <img src={symbol.src} alt="" />
          </button>
        ))}
      </div>
      {legendOpen && <SymbolLegendModal onClose={() => setLegendOpen(false)} />}
    </div>
  )
}
