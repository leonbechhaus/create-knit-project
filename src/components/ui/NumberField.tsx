import type { InputHTMLAttributes } from 'react'

import styles from './NumberField.module.css'

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  /** Compact caption shown above the input, e.g. "St/10" or "Width". */
  label?: string
  /** Trailing unit shown after the input, e.g. "cm" or "H". */
  unit?: string
}

/**
 * The one boxed numeric input used for gauge/size fields across the gauge
 * wizard, project-creation form, and project settings — right-aligned
 * value, spinner arrows stripped, focus ring on the box itself.
 */
export function NumberField({ label, unit, ...rest }: NumberFieldProps) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <input type="number" className={styles.input} {...rest} />
      {unit && <span className={styles.unit}>{unit}</span>}
    </label>
  )
}
