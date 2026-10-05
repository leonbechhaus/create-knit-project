import type { CSSProperties } from 'react'

import type { Swatch } from '../../domain/color'
import styles from './ColorSwatch.module.css'

type ColorSwatchProps = {
  swatch: Swatch
  active?: boolean
  /** 'lg' (default) — Color Studio palette. 'compact' — dense grids like the
   *  selection context menu's color flyout. 'mini' — toolbar quick-access,
   *  too small to show initials. */
  size?: 'lg' | 'compact' | 'mini'
  onClick?: () => void
}

/** The one color-button design used everywhere a swatch can be picked —
 *  Color Studio, the selection context menu, and the toolbar — so hover/active
 *  treatment stays consistent across the app. */
export function ColorSwatch({ swatch, active = false, size = 'lg', onClick }: ColorSwatchProps) {
  const inlineStyle: CSSProperties = {
    background: `hsla(${swatch.color.h}, ${swatch.color.s}%, ${swatch.color.l}%, ${swatch.color.a})`,
  }

  return (
    <button
      type="button"
      className={[
        styles.colorSwatch,
        active ? styles.colorSwatchActive : '',
        size === 'compact' ? styles.colorSwatchCompact : '',
        size === 'mini' ? styles.colorSwatchMini : '',
      ].join(' ')}
      style={inlineStyle}
      onClick={onClick}
      title={swatch.name}
      aria-label={swatch.name}
    >
      {size !== 'mini' && <span>{swatch.name.slice(0, 2).toUpperCase()}</span>}
    </button>
  )
}
