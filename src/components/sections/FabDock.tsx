import { LuFolderOpen, LuPalette } from 'react-icons/lu'

import appStyles from '../../App.module.css'

// The two floating action buttons that toggle the left (project) and right
// (color studio) offcanvas panels — fixed bottom-left / bottom-right.
export function FabDock({
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}: {
  leftOpen: boolean
  rightOpen: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
}) {
  return (
    <>
      <button
        type="button"
        className={`${appStyles.fab} ${appStyles.fabLeft} ${leftOpen ? appStyles.fabActive : ''}`}
        onClick={onToggleLeft}
        title="Projects & settings"
      >
        <LuFolderOpen size={22} strokeWidth={1.8} />
      </button>

      <button
        type="button"
        className={`${appStyles.fab} ${appStyles.fabRight} ${rightOpen ? appStyles.fabActive : ''}`}
        onClick={onToggleRight}
        title="Color studio"
      >
        <LuPalette size={22} strokeWidth={1.8} />
      </button>
    </>
  )
}
