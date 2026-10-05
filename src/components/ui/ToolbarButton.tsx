import type { ReactNode } from 'react'
import styles from './ToolbarButton.module.css'

type ToolbarButtonProps = {
  label: string
  icon: ReactNode
  active?: boolean
  compact?: boolean // icon-only, for use inside the fixed top toolbar
  onClick: () => void
  disabled?: boolean
}

export function ToolbarButton({
  label,
  icon,
  active = false,
  compact = false,
  onClick,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.btn,
        active ? styles.active : '',
        compact ? styles.compact : '',
        disabled ? styles.disabled : '',
      ].join(' ')}
      onClick={onClick}
      title={label}
      aria-pressed={active}
      disabled={disabled}
    >
      <span className={styles.iconWrap}>{icon}</span>
      {!compact && <small className={styles.label}>{label}</small>}
    </button>
  )
}
