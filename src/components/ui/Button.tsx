import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger-ghost'
type ButtonSize = 'sm' | 'md'

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icon shown before the label — pass a react-icons element. */
  icon?: ReactNode
  fullWidth?: boolean
}

/**
 * The one button look-and-feel used everywhere: a gradient `primary` CTA, a
 * soft `secondary` surface button, a bordered `outline` ghost (compact
 * actions like "+ Add"/"+ New"), a borderless `ghost` text button, and a
 * `danger-ghost` for destructive text actions. Every button in the app
 * should render through this instead of a bespoke CSS class per component.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth = false,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.btn,
    styles[variant],
    size === 'sm' ? styles.sm : '',
    fullWidth ? styles.fullWidth : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classNames} {...rest}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}
