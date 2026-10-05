import { LuCrosshair } from 'react-icons/lu'

import appStyles from '../../App.module.css'
import type { DisplayCell } from '../GridCanvas'

// Floating pill, fixed bottom-center between the two FABs — shows only the
// hovered cell's coordinates (no axis labels — position is always x, y).
// Single responsibility: selection details live in their own floating badge
// anchored directly under the marquee instead (see GridCanvas).
export function CoordinateStatusBar({ hover }: { hover: DisplayCell | null }) {
  if (!hover) return null

  return (
    <div className={appStyles.coordBar}>
      <span className={appStyles.coordBarItem}>
        <LuCrosshair size={13} strokeWidth={2} />
        {hover.x}, {hover.y}
      </span>
    </div>
  )
}
