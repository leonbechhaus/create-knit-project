import type { CSSProperties } from 'react'
import { LuPencil, LuX } from 'react-icons/lu'

import appStyles from '../../App.module.css'
import { useInlineRename } from '../../hooks/useInlineRename'
import { useKnittingStore } from '../../store/useKnittingStore'
import { IconButton } from '../ui/IconButton'
import { SectionHeader } from '../ui/SectionHeader'
import { SliderField } from '../ui/SliderField'
import { PalettePanel } from '../PalettePanel'
import styles from './ColorStudioSection.module.css'

// Right offcanvas: swatch palette, big live preview, and precise HSL/A
// slider editing with per-slider gradient previews. Fully self-contained
// aside from open/close, which is orchestrated by the app shell.
export function ColorStudioSection({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    swatches,
    selectedSwatchId,
    setSelectedSwatchId,
    updateSwatch,
    addSwatch,
    renameSwatch,
    setSwatchCategory,
  } = useKnittingStore()

  const selectedSwatch = swatches.find((s) => s.id === selectedSwatchId) ?? swatches[0]
  const rename = useInlineRename(selectedSwatch?.name ?? '', (name) => {
    if (selectedSwatch) renameSwatch(selectedSwatch.id, name)
  })

  const previewStyle = selectedSwatch
    ? ({
        '--swatch-h': `${selectedSwatch.color.h}`,
        '--swatch-s': `${selectedSwatch.color.s}%`,
        '--swatch-l': `${selectedSwatch.color.l}%`,
        '--swatch-a': `${selectedSwatch.color.a}`,
      } as CSSProperties)
    : undefined

  // Per-slider gradient previews — show the full range of each parameter
  // at the current values of the others.
  const sliderPreviews = selectedSwatch
    ? (() => {
        const { h, s, l, a } = selectedSwatch.color
        // Checkerboard tile for the alpha preview
        const checker =
          'conic-gradient(#ccc 90deg, #f0ece8 90deg 180deg, #ccc 180deg 270deg, #f0ece8 270deg) 0 0 / 8px 8px'
        return {
          hue: `linear-gradient(to right,
            hsl(0,${s}%,${l}%), hsl(30,${s}%,${l}%), hsl(60,${s}%,${l}%),
            hsl(90,${s}%,${l}%), hsl(120,${s}%,${l}%), hsl(150,${s}%,${l}%),
            hsl(180,${s}%,${l}%), hsl(210,${s}%,${l}%), hsl(240,${s}%,${l}%),
            hsl(270,${s}%,${l}%), hsl(300,${s}%,${l}%), hsl(330,${s}%,${l}%),
            hsl(360,${s}%,${l}%))`,
          sat: `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`,
          lit: `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`,
          alpha: `linear-gradient(to right, hsla(${h},${s}%,${l}%,0), hsla(${h},${s}%,${l}%,${a}), hsla(${h},${s}%,${l}%,1)), ${checker}`,
        }
      })()
    : null

  const handleAddSwatch = () =>
    addSwatch(`Custom ${swatches.length + 1}`, { h: 210, s: 75, l: 58, a: 1 }, 'project')

  const handleSelectSwatch = (id: string) => {
    rename.cancel()
    setSelectedSwatchId(id)
  }

  return (
    <aside
      className={`${appStyles.slidePanel} ${appStyles.slidePanelRight} ${open ? appStyles.slidePanelOpen : ''}`}
    >
      <div className={appStyles.panelHead}>
        <SectionHeader>
          <SectionHeader.Heading>
            <SectionHeader.Eyebrow>Color</SectionHeader.Eyebrow>
            <SectionHeader.Title>Studio</SectionHeader.Title>
          </SectionHeader.Heading>
          <SectionHeader.Actions>
            <IconButton onClick={onClose} aria-label="Close">
              <LuX size={15} strokeWidth={2} />
            </IconButton>
          </SectionHeader.Actions>
        </SectionHeader>
      </div>

      {/* Swatch palette — pick which swatch to edit */}
      <PalettePanel
        swatches={swatches}
        selectedSwatchId={selectedSwatchId}
        onSelectSwatch={handleSelectSwatch}
        onAddSwatch={handleAddSwatch}
      />

      {selectedSwatch && (
        <>
          <div className={appStyles.divider} />

          {/* Large color preview */}
          <div className={appStyles.colorPreview} style={previewStyle} />
          <div className={appStyles.colorPreviewMeta}>
            {rename.renaming ? (
              <input
                autoFocus
                className={styles.renameInput}
                value={rename.draft}
                onChange={(e) => rename.setDraft(e.target.value)}
                onBlur={rename.commit}
                onKeyDown={rename.handleKeyDown}
              />
            ) : (
              <div className={styles.nameGroup}>
                <strong className={styles.swatchName}>{selectedSwatch.name}</strong>
                <IconButton size="sm" title="Rename color" onClick={rename.start}>
                  <LuPencil size={12} strokeWidth={2} />
                </IconButton>
              </div>
            )}

            {/* Scope — whether this swatch is shared across every project
                (global) or only ever appears in this one (project). */}
            <div className={styles.categoryToggle} role="group" aria-label="Color scope">
              <button
                type="button"
                className={`${styles.categoryOption} ${selectedSwatch.category === 'project' ? styles.categoryOptionActive : ''}`}
                onClick={() => setSwatchCategory(selectedSwatch.id, 'project')}
              >
                Project
              </button>
              <button
                type="button"
                className={`${styles.categoryOption} ${selectedSwatch.category === 'global' ? styles.categoryOptionActive : ''}`}
                onClick={() => setSwatchCategory(selectedSwatch.id, 'global')}
              >
                Global
              </button>
            </div>
          </div>

          <div className={appStyles.divider} />

          {/* HSL/A sliders — flat, no card wrapper */}
          <div className={appStyles.sliderGroup}>
            <SliderField
              label="H"
              value={selectedSwatch.color.h}
              min={0}
              max={360}
              step={1}
              preview={sliderPreviews?.hue}
              colorMode
              onChange={(v) => updateSwatch(selectedSwatch.id, { ...selectedSwatch.color, h: v })}
            />
            <SliderField
              label="S"
              value={selectedSwatch.color.s}
              min={0}
              max={100}
              step={1}
              preview={sliderPreviews?.sat}
              colorMode
              onChange={(v) => updateSwatch(selectedSwatch.id, { ...selectedSwatch.color, s: v })}
            />
            <SliderField
              label="L"
              value={selectedSwatch.color.l}
              min={0}
              max={100}
              step={1}
              preview={sliderPreviews?.lit}
              colorMode
              onChange={(v) => updateSwatch(selectedSwatch.id, { ...selectedSwatch.color, l: v })}
            />
            <SliderField
              label="A"
              value={selectedSwatch.color.a}
              min={0}
              max={1}
              step={0.01}
              preview={sliderPreviews?.alpha}
              colorMode
              formatValue={(v) => v.toFixed(2)}
              onChange={(v) => updateSwatch(selectedSwatch.id, { ...selectedSwatch.color, a: v })}
            />
          </div>
        </>
      )}
    </aside>
  )
}
