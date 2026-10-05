import type { CSSProperties } from 'react'
import styles from './SliderField.module.css'

type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (nextValue: number) => void
  formatValue?: (value: number) => string
  /**
   * CSS `background` string used as the track gradient in colorMode,
   * or as the preview bar above the slider in default mode.
   */
  preview?: string
  /**
   * colorMode: the gradient IS the range track.
   * The number input moves inline with the label. No separate preview bar.
   */
  colorMode?: boolean
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  preview,
  colorMode = false,
}: SliderFieldProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}`

  if (colorMode) {
    return (
      <div className={styles.colorField}>
        <div className={styles.colorHeader}>
          <span className={styles.colorLabel}>{label}</span>
          <input
            className={styles.inlineNumber}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
        <input
          className={styles.colorTrack}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ background: preview } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    )
  }

  /* ── Default mode ── */
  const indicatorPct = `${((value - min) / (max - min)) * 100}%`
  return (
    <div className={styles.sliderField}>
      <div className={styles.header}>
        <label>{label}</label>
        <span>{displayValue}</span>
      </div>

      {preview && (
        <div
          className={styles.preview}
          style={{ background: preview, '--indicator-pct': indicatorPct } as CSSProperties}
        />
      )}

      <div className={styles.controls}>
        <input
          className={styles.rangeInput}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ '--fill-pct': indicatorPct } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          className={styles.numberInput}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
