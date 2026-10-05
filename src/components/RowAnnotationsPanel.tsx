import { useState } from 'react'
import { LuCirclePlus, LuStickyNote } from 'react-icons/lu'

import type { RowAnnotation } from '../domain/project'
import { getStitchSymbol } from '../domain/symbols'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { IconSymbolPicker } from './ui/IconSymbolPicker'
import { Modal } from './ui/Modal'
import { EMPTY_EVEN, EMPTY_ODD } from './GridCanvas'
import styles from './RowAnnotationsPanel.module.css'

type Point = { x: number; y: number }

type RowAnnotationsPanelProps = {
  rowAnnotations: RowAnnotation[]
  cellSize: number
  onAddIcon: (rowIndex: number, symbolId: string) => void
  onRemoveIcon: (rowIndex: number, iconIndex: number) => void
  onSaveNote: (rowIndex: number, note: string) => void
}

const PICKER_WIDTH = 232

/**
 * Per-row chart annotation strip beside the row ruler: an arbitrary number of
 * stitch-symbol icons per row (added via the trailing "+" button, which keeps
 * sliding right as icons are appended) plus a note button that always stays
 * reachable at the row's far end. Row heights match `cellSize` exactly so
 * each divider lines up with the grid's own row boundaries.
 */
export function RowAnnotationsPanel({
  rowAnnotations,
  cellSize,
  onAddIcon,
  onRemoveIcon,
  onSaveNote,
}: RowAnnotationsPanelProps) {
  const [picker, setPicker] = useState<{ rowIndex: number; position: Point } | null>(null)
  const [noteRow, setNoteRow] = useState<number | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const iconSize = Math.max(10, Math.min(cellSize - 6, 18))
  const chipSize = iconSize + 6 // icon size + its own padding (see .iconChip)
  const stripGap = 4
  // Cap the visible strip so a 5th icon peeks in half-cut-off — a clear,
  // self-evident "scroll for more" affordance instead of silently hiding
  // overflow with no visual hint.
  const stripMaxWidth = Math.round(4.5 * chipSize + 4 * stripGap)

  const openPicker = (rowIndex: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    let x = rect.left
    if (x + PICKER_WIDTH > window.innerWidth - 8) x = window.innerWidth - PICKER_WIDTH - 8
    setPicker({ rowIndex, position: { x: Math.max(8, x), y: rect.bottom + 6 } })
  }

  const openNoteModal = (rowIndex: number) => {
    setNoteDraft(rowAnnotations[rowIndex]?.note ?? '')
    setNoteRow(rowIndex)
  }

  const saveNote = () => {
    if (noteRow === null) return
    onSaveNote(noteRow, noteDraft.trim())
    setNoteRow(null)
  }

  return (
    <div className={styles.panel}>
      {rowAnnotations.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={styles.row}
          style={{
            height: cellSize,
            background: rowIndex % 2 === 0 ? EMPTY_EVEN : EMPTY_ODD,
          }}
        >
          <div className={styles.iconStrip} style={{ maxWidth: stripMaxWidth }}>
            {row.icons.map((symbolId, iconIndex) => {
              const symbol = getStitchSymbol(symbolId)
              return (
                <button
                  key={iconIndex}
                  type="button"
                  className={styles.iconChip}
                  style={{ width: iconSize + 6, height: iconSize + 6 }}
                  title={`${symbol?.label ?? symbolId} — click to remove`}
                  onClick={() => onRemoveIcon(rowIndex, iconIndex)}
                >
                  {symbol && (
                    <img src={symbol.src} alt={symbol.label} width={iconSize} height={iconSize} />
                  )}
                </button>
              )
            })}
            <IconButton
              size="sm"
              aria-label="Add a stitch symbol to this row"
              title="Add a stitch symbol"
              onClick={(e) => openPicker(rowIndex, e)}
            >
              <LuCirclePlus size={15} strokeWidth={2} />
            </IconButton>
          </div>

          <span className={styles.noteButtonWrap}>
            <IconButton
              size="sm"
              aria-label={row.note ? 'Edit row note' : 'Add a row note'}
              title={row.note ? 'Edit row note' : 'Add a row note'}
              onClick={() => openNoteModal(rowIndex)}
            >
              <LuStickyNote
                size={13}
                strokeWidth={2}
                className={row.note ? styles.noteIconActive : undefined}
              />
            </IconButton>
            {row.note && <span className={styles.noteBadge}>!</span>}
          </span>
        </div>
      ))}

      {picker && (
        <IconSymbolPicker
          position={picker.position}
          onPick={(symbolId) => onAddIcon(picker.rowIndex, symbolId)}
          onClose={() => setPicker(null)}
        />
      )}

      {noteRow !== null && (
        <Modal onClose={() => setNoteRow(null)}>
          <Modal.Header>
            <Modal.Title>Row note</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <textarea
              className={styles.noteTextarea}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add any notes for this row — special instructions, reminders, anything arbitrary…"
              autoFocus
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setNoteRow(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveNote}>
              Save note
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}
