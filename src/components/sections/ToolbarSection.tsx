import {
  LuBlend,
  LuBug,
  LuEraser,
  LuFlipVertical2,
  LuLassoSelect,
  LuPaintBucket,
  LuPencil,
  LuPen,
  LuPipette,
  LuRedo2,
  LuSquareDashedMousePointer,
  LuStamp,
  LuUndo2,
  LuX,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu'

import appStyles from '../../App.module.css'
import type { ToolKind } from '../../domain/project'
import { useKnittingStore } from '../../store/useKnittingStore'
import { ColorSwatch } from '../ui/ColorSwatch'
import { ToolbarButton } from '../ui/ToolbarButton'

const TOOLS: Array<{ tool: ToolKind; icon: React.ReactNode; label: string }> = [
  { tool: 'paint', icon: <LuPencil size={18} strokeWidth={1.8} />, label: 'Paint (B)' },
  { tool: 'erase', icon: <LuEraser size={18} strokeWidth={1.8} />, label: 'Erase (E)' },
  { tool: 'fill', icon: <LuPaintBucket size={18} strokeWidth={1.8} />, label: 'Fill (G)' },
  { tool: 'line', icon: <LuPen size={18} strokeWidth={1.8} />, label: 'Line (L)' },
  {
    tool: 'select',
    icon: <LuSquareDashedMousePointer size={18} strokeWidth={1.8} />,
    label: 'Select (M)',
  },
  { tool: 'lasso', icon: <LuLassoSelect size={18} strokeWidth={1.8} />, label: 'Lasso (Q)' },
  { tool: 'stamp', icon: <LuStamp size={18} strokeWidth={1.8} />, label: 'Stamp (S)' },
  { tool: 'eyedropper', icon: <LuPipette size={18} strokeWidth={1.8} />, label: 'Pick (I)' },
]

const MAX_VISIBLE_SWATCHES = 10

// Fixed top toolbar: project name, drawing tools, undo/redo, zoom, flip-Y,
// onion-skin controls, and swatch quick-access. `onOpenColorStudio` lets the
// swatch-overflow chip hand off to the full Color Studio panel.
export function ToolbarSection({ onOpenColorStudio }: { onOpenColorStudio: () => void }) {
  const {
    project,
    swatches,
    activeTool,
    selectedSwatchId,
    zoom,
    flipY,
    setSelectedSwatchId,
    setActiveTool,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    setFlipY,
    undoStack,
    redoStack,
    onionSkinEnabled,
    onionSkinLayerId,
    setOnionSkinEnabled,
    setOnionSkinLayerId,
    patternUnits,
    activePatternUnitId,
    setActivePatternUnitId,
  } = useKnittingStore()

  const activeLayer = project.layers.find((l) => l.id === project.activeLayerId)
  const otherLayers = project.layers.filter((l) => l.id !== project.activeLayerId)
  const zoomLabel = `${Math.round(zoom * 100)}%`

  const visible = swatches.slice(0, MAX_VISIBLE_SWATCHES)
  const overflow = swatches.length - MAX_VISIBLE_SWATCHES

  return (
    <div className={appStyles.fixedToolbar}>
      {/* Project name */}
      <span className={appStyles.toolbarProject}>{project.name}</span>
      <span className={appStyles.toolbarDivider} />

      {/* Drawing tools */}
      {TOOLS.map(({ tool, icon, label }) => (
        <ToolbarButton
          key={tool}
          icon={icon}
          label={label}
          compact
          active={activeTool === tool}
          onClick={() => setActiveTool(tool)}
        />
      ))}
      {activeTool === 'stamp' && (
        <select
          className={appStyles.toolbarOnionSelect}
          value={activePatternUnitId ?? ''}
          onChange={(e) => setActivePatternUnitId(e.target.value || null)}
          title="Active pattern unit to stamp"
        >
          {patternUnits.length === 0 && <option value="">No pattern units saved</option>}
          {patternUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      )}
      <span className={appStyles.toolbarDivider} />

      {/* Undo / Redo */}
      <ToolbarButton
        icon={<LuUndo2 size={16} strokeWidth={1.8} />}
        label="Undo (⌘Z)"
        compact
        disabled={undoStack.length === 0}
        onClick={undo}
      />
      <ToolbarButton
        icon={<LuRedo2 size={16} strokeWidth={1.8} />}
        label="Redo (⌘⇧Z)"
        compact
        disabled={redoStack.length === 0}
        onClick={redo}
      />
      <span className={appStyles.toolbarDivider} />

      {/* Zoom */}
      <ToolbarButton
        icon={<LuZoomOut size={16} strokeWidth={1.8} />}
        label="Zoom out (-)"
        compact
        onClick={zoomOut}
      />
      <button
        type="button"
        className={appStyles.zoomLabel}
        onClick={resetZoom}
        title="Reset zoom (0)"
      >
        {zoomLabel}
      </button>
      <ToolbarButton
        icon={<LuZoomIn size={16} strokeWidth={1.8} />}
        label="Zoom in (+)"
        compact
        onClick={zoomIn}
      />
      <span className={appStyles.toolbarDivider} />

      {/* Flip Y */}
      <ToolbarButton
        icon={<LuFlipVertical2 size={16} strokeWidth={1.8} />}
        label="Flip row axis — row 1 at bottom (F)"
        compact
        active={flipY}
        onClick={() => setFlipY(!flipY)}
      />
      <span className={appStyles.toolbarDivider} />

      {/* Onion skin — reference any other layer, not just a connected one;
          it's a drawing aid, unrelated to seam-rounding connections. */}
      <ToolbarButton
        icon={<LuBlend size={16} strokeWidth={1.8} />}
        label="Onion skin — trace another layer (O)"
        compact
        active={onionSkinEnabled}
        disabled={otherLayers.length === 0}
        onClick={() => {
          const next = !onionSkinEnabled
          setOnionSkinEnabled(next)
          if (next && !onionSkinLayerId) setOnionSkinLayerId(otherLayers[0]?.id ?? null)
        }}
      />
      {onionSkinEnabled && otherLayers.length > 0 && (
        <select
          className={appStyles.toolbarOnionSelect}
          value={onionSkinLayerId ?? ''}
          onChange={(e) => setOnionSkinLayerId(e.target.value || null)}
          title="Onion-skin reference layer"
        >
          {otherLayers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      )}
      <span className={appStyles.toolbarDivider} />

      {/* Swatch quick-access — capped at MAX_VISIBLE; overflow shown as +N chip */}
      {visible.map((swatch) => (
        <ColorSwatch
          key={swatch.id}
          swatch={swatch}
          size="mini"
          active={swatch.id === selectedSwatchId}
          onClick={() => setSelectedSwatchId(swatch.id)}
        />
      ))}
      {overflow > 0 && (
        <button
          type="button"
          className={appStyles.swatchOverflow}
          onClick={onOpenColorStudio}
          title={`${overflow} more colour${overflow > 1 ? 's' : ''} — open Color Studio`}
        >
          +{overflow}
        </button>
      )}

      {/* Physical size */}
      <div className={appStyles.toolbarMeta}>
        {activeLayer && (
          <span className={appStyles.toolbarMetaItem}>
            {activeLayer.name} · {activeLayer.cmWidth}
            <LuX size={10} strokeWidth={2} />
            {activeLayer.cmHeight} cm
          </span>
        )}
      </div>

      {/* Alpha build marker + feedback — only meaningful while we're in
          friends-and-family testing, remove once this ships publicly. */}
      <ToolbarButton
        icon={<LuBug size={16} strokeWidth={1.8} />}
        label={`Report a bug — alpha build v${__APP_VERSION__}`}
        compact
        onClick={() =>
          window.open(
            `https://github.com/leonbechhaus/create-knit-project/issues/new?title=${encodeURIComponent(
              `[v${__APP_VERSION__}] `,
            )}`,
            '_blank',
            'noopener,noreferrer',
          )
        }
      />
    </div>
  )
}
