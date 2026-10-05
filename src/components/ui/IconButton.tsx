import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './IconButton.module.css'

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonVariant = 'default' | 'danger'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  children: ReactNode
  size?: IconButtonSize
  variant?: IconButtonVariant
}

/**
 * The one small square icon-only button used for rename/delete/close/info
 * affordances across panels, rows and modals — transparent by default with
 * a soft tinted fill on hover. Replaces the many near-identical `.iconBtn` /
 * `.closeButton` / `.renameBtn` CSS blocks that used to live per-component.
 */
export function IconButton({
  children,
  size = 'md',
  variant = 'default',
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classNames = [styles.btn, styles[size], variant === 'danger' ? styles.danger : ''].join(' ')

  return (
    <button type={type} className={classNames} {...rest}>
      {children}
    </button>
  )
}
