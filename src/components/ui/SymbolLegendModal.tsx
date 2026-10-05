import { STITCH_SYMBOLS } from '../../domain/symbols'
import { Modal } from './Modal'
import styles from './SymbolLegendModal.module.css'

type SymbolLegendModalProps = {
  onClose: () => void
}

/** Full-reference legend for every stitch-chart symbol: icon, name, and a
 *  plain-language description of what it means — one row per symbol, divided
 *  like a spec sheet, so a chart can be read without memorizing the set.
 *  Rendered `nested` so it can stack above the icon-symbol-picker flyout. */
export function SymbolLegendModal({ onClose }: SymbolLegendModalProps) {
  return (
    <Modal onClose={onClose} size="md" nested>
      <Modal.Header>
        <Modal.Title>Stitch symbol legend</Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <div className={styles.list}>
          {STITCH_SYMBOLS.map((symbol) => (
            <div key={symbol.id} className={styles.row}>
              <div className={styles.iconCell}>
                <img src={symbol.src} alt="" width={22} height={22} />
              </div>
              <div className={styles.textCell}>
                <div className={styles.label}>{symbol.label}</div>
                <div className={styles.description}>{symbol.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  )
}
