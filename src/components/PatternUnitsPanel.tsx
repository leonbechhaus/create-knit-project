import { LuPencil, LuStamp, LuTrash2 } from 'react-icons/lu'

import appStyles from '../App.module.css'
import type { Swatch } from '../domain/color'
import type { PatternUnit } from '../domain/patternUnit'
import { useInlineRename } from '../hooks/useInlineRename'
import { useKnittingStore } from '../store/useKnittingStore'
import { EntityRow } from './ui/EntityRow'
import { IconButton } from './ui/IconButton'
import { PatternUnitThumbnail } from './PatternUnitThumbnail'
import styles from './PatternUnitsPanel.module.css'

/**
 * Profile-wide list of saved Pattern Units — shared across every project,
 * same scope as global color swatches. Clicking a row selects it as the
 * active stamp and switches straight to the Stamp tool, so picking a
 * pattern and placing it is a single click.
 */
export function PatternUnitsPanel() {
  const {
    patternUnits,
    swatches,
    activePatternUnitId,
    setActivePatternUnitId,
    renamePatternUnit,
    deletePatternUnit,
    setActiveTool,
  } = useKnittingStore()

  return (
    <div className={appStyles.tabPanel}>
      <div className={appStyles.section}>
        <p className={appStyles.eyebrow}>Pattern units</p>

        {patternUnits.length === 0 ? (
          <p className={appStyles.hintText}>
            No pattern units yet. Make a selection on the canvas, right-click it, and choose
            <strong> Save as pattern unit</strong> to capture one here.
          </p>
        ) : (
          <div className={styles.list}>
            {patternUnits.map((unit) => (
              <PatternUnitRow
                key={unit.id}
                unit={unit}
                swatches={swatches}
                active={unit.id === activePatternUnitId}
                onSelect={() => {
                  setActivePatternUnitId(unit.id)
                  setActiveTool('stamp')
                }}
                onRename={(name) => renamePatternUnit(unit.id, name)}
                onRemove={() => deletePatternUnit(unit.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PatternUnitRow({
  unit,
  swatches,
  active,
  onSelect,
  onRename,
  onRemove,
}: {
  unit: PatternUnit
  swatches: Swatch[]
  active: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onRemove: () => void
}) {
  const rename = useInlineRename(unit.name, onRename)

  return (
    <EntityRow active={active}>
      <EntityRow.Main onClick={onSelect}>
        <EntityRow.Leading>
          <PatternUnitThumbnail unit={unit} swatches={swatches} />
        </EntityRow.Leading>
        <EntityRow.Body>
          {rename.renaming ? (
            <EntityRow.RenameInput
              value={rename.draft}
              onChange={(e) => rename.setDraft(e.target.value)}
              onBlur={rename.commit}
              onKeyDown={rename.handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <EntityRow.Name>{unit.name}</EntityRow.Name>
          )}
          <EntityRow.Meta>
            {unit.width} × {unit.height} st
          </EntityRow.Meta>
        </EntityRow.Body>
      </EntityRow.Main>
      <EntityRow.Actions>
        {active && (
          <LuStamp size={13} strokeWidth={2} className={styles.activeIcon} title="Active stamp" />
        )}
        <IconButton
          title="Rename"
          onClick={(e) => {
            e.stopPropagation()
            rename.start()
          }}
        >
          <LuPencil size={13} strokeWidth={2} />
        </IconButton>
        <IconButton
          variant="danger"
          title="Delete pattern unit"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <LuTrash2 size={13} strokeWidth={2} />
        </IconButton>
      </EntityRow.Actions>
    </EntityRow>
  )
}
