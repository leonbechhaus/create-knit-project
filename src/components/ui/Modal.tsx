import { createContext, useContext, type ReactNode } from 'react'
import { LuX } from 'react-icons/lu'

import { IconButton } from './IconButton'
import styles from './Modal.module.css'
import { ModalPortal } from './ModalPortal'

type ModalSize = 'sm' | 'md' | 'lg'

const ModalCloseContext = createContext<(() => void) | null>(null)

type ModalProps = {
  onClose: () => void
  children: ReactNode
  size?: ModalSize
  /** Stack above a regular modal — used for the symbol legend, which can
   *  open on top of the icon picker flyout. */
  nested?: boolean
}

/**
 * The one modal shell used everywhere: portaled past transform/contain
 * containing blocks, centered backdrop, and a compound API so each modal
 * composes only the pieces it needs instead of passing opaque title/footer
 * props. `Modal.CloseButton` reads `onClose` from context, so it never has
 * to be re-wired by the caller.
 *
 * @example
 * <Modal onClose={close}>
 *   <Modal.Header>
 *     <Modal.Title>Stitch count conflict</Modal.Title>
 *     <Modal.CloseButton />
 *   </Modal.Header>
 *   <Modal.Body>…</Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="primary">Apply</Button>
 *   </Modal.Footer>
 * </Modal>
 */
export function Modal({ onClose, children, size = 'sm', nested = false }: ModalProps) {
  return (
    <ModalPortal>
      <ModalCloseContext.Provider value={onClose}>
        <div className={`${styles.backdrop} ${nested ? styles.nested : ''}`} onClick={onClose}>
          <div className={`${styles.modal} ${styles[size]}`} onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      </ModalCloseContext.Provider>
    </ModalPortal>
  )
}

Modal.Header = function ModalHeader({ children }: { children: ReactNode }) {
  return <div className={styles.header}>{children}</div>
}

Modal.Title = function ModalTitle({ children }: { children: ReactNode }) {
  return <h3 className={styles.title}>{children}</h3>
}

Modal.CloseButton = function ModalCloseButton() {
  const onClose = useContext(ModalCloseContext)
  return (
    <IconButton onClick={() => onClose?.()} aria-label="Close">
      <LuX size={15} strokeWidth={2} />
    </IconButton>
  )
}

Modal.Body = function ModalBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>
}

Modal.Footer = function ModalFooter({
  children,
  stack = false,
}: {
  children: ReactNode
  /** Stack full-width buttons in a column instead of the default
   *  flex-end row — used for single-column confirm/cancel actions. */
  stack?: boolean
}) {
  return <div className={`${styles.footer} ${stack ? styles.footerStack : ''}`}>{children}</div>
}
