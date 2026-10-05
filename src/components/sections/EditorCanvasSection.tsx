import { useState } from 'react'

import appStyles from '../../App.module.css'
import { effectiveGauge, getActiveLayer } from '../../domain/project'
import { useKnittingStore } from '../../store/useKnittingStore'
import { type DisplayCell, GridCanvas } from '../GridCanvas'
import { CoordinateStatusBar } from './CoordinateStatusBar'

// Main editor surface — resolves the active layer plus the optional
// onion-skin reference layer and hands them to the canvas.
export function EditorCanvasSection() {
  const { project, swatches, selectedSwatchId, zoom, flipY, onionSkinEnabled, onionSkinLayerId } =
    useKnittingStore()

  const [hoverCell, setHoverCell] = useState<DisplayCell | null>(null)

  const activeLayer = getActiveLayer(project)
  const onionLayer = onionSkinEnabled
    ? (project.layers.find((l) => l.id === onionSkinLayerId) ?? null)
    : null
  const gauge = activeLayer ? effectiveGauge(activeLayer, project) : null

  return (
    <main className={appStyles.editorMain}>
      <div className={appStyles.editorSurface}>
        {activeLayer && gauge && (
          <GridCanvas
            layer={activeLayer}
            onionLayer={onionLayer}
            swatches={swatches}
            selectedSwatchId={selectedSwatchId}
            zoom={zoom}
            flipY={flipY}
            gauge={gauge}
            onHoverCellChange={setHoverCell}
          />
        )}
      </div>

      {/* Single responsibility: this bar only ever shows the hover position.
          Selection details float directly under the marquee instead (see
          GridCanvas's own selection badge). */}
      <CoordinateStatusBar hover={hoverCell} />
    </main>
  )
}
