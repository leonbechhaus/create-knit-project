import { createPortal } from 'react-dom'

type ModalPortalProps = {
  children: React.ReactNode
}

/**
 * Renders its children as a direct child of the app shell root instead of
 * wherever they'd normally land in the tree. Several modals (gauge-conflict,
 * row notes, …) live deep inside slide-out panels that use `transform` +
 * `contain` for their open/close animation — both of those create a new
 * containing block, so a `position: fixed` modal nested inside gets
 * clipped/mispositioned by the panel's own bounds instead of centering on
 * the viewport. Portaling past all of that keeps modals in one flat,
 * predictable stacking context regardless of where they're triggered from.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  const target = document.getElementById('app-shell') ?? document.body
  return createPortal(children, target)
}
