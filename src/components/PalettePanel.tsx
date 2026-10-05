import { LuPlus } from 'react-icons/lu'
import type { Swatch } from '../domain/color'
import { ColorSwatch } from './ui/ColorSwatch'
import styles from './PalettePanel.module.css'

type PalettePanelProps = {
  swatches: Swatch[]
  selectedSwatchId: string | null
  onSelectSwatch: (swatchId: string) => void
  onAddSwatch: () => void
}

export function PalettePanel({
  swatches,
  selectedSwatchId,
  onSelectSwatch,
  onAddSwatch,
}: PalettePanelProps) {
  return (
    <div className={styles.palette}>
      <div className={styles.grid}>
        {swatches.map((swatch) => (
          <ColorSwatch
            key={swatch.id}
            swatch={swatch}
            active={swatch.id === selectedSwatchId}
            onClick={() => onSelectSwatch(swatch.id)}
          />
        ))}
        <button type="button" className={styles.addBtn} onClick={onAddSwatch} title="Add swatch">
          <LuPlus size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
