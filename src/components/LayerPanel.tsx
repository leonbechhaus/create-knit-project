import { useState } from 'react'
import { LuLink2, LuPencil, LuPlus, LuTrash2, LuUnlink } from 'react-icons/lu'

import appStyles from '../App.module.css'
import { getActiveLayer, type Layer } from '../domain/project'
import { useInlineRename } from '../hooks/useInlineRename'
import { useKnittingStore } from '../store/useKnittingStore'
import { Button } from './ui/Button'
import { EntityRow } from './ui/EntityRow'
import { IconButton } from './ui/IconButton'
import { GaugeWizard } from './GaugeWizard'
import styles from './LayerPanel.module.css'

export function LayerPanel() {
  const {
    project,
    addLayer,
    removeLayer,
    renameLayer,
    setActiveLayerId,
    connectLayers,
    disconnectLayer,
    applyLayerSizes,
  } = useKnittingStore()

  const [newLayerName, setNewLayerName] = useState('')

  const activeLayer = getActiveLayer(project)
  if (!activeLayer) return null

  const handleAdd = () => {
    const name = newLayerName.trim() || `Layer ${project.layers.length + 1}`
    addLayer(name)
    setNewLayerName('')
  }

  return (
    <div className={appStyles.tabPanel}>
      <div className={appStyles.section}>
        <p className={appStyles.eyebrow}>Layers</p>

        <div className={styles.list}>
          {project.layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              active={layer.id === project.activeLayerId}
              removable={project.layers.length > 1}
              onSelect={() => setActiveLayerId(layer.id)}
              onRename={(name) => renameLayer(layer.id, name)}
              onRemove={() => removeLayer(layer.id)}
            />
          ))}
        </div>

        <div className={styles.addRow}>
          <input
            className={styles.nameInput}
            placeholder="New layer name (e.g. Back piece)"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            variant="outline"
            size="sm"
            icon={<LuPlus size={13} strokeWidth={2.5} />}
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>
      </div>

      <div className={appStyles.divider} />

      <div className={appStyles.section}>
        <p className={appStyles.eyebrow}>Connection</p>
        <p className={appStyles.hintText}>
          Link <strong>{activeLayer.name}</strong> to another layer so stitch-count rounding is
          resolved jointly across the seam (e.g. front + back).
        </p>
        <select
          className={styles.select}
          value={activeLayer.connectedLayerId ?? ''}
          onChange={(e) => {
            const val = e.target.value
            if (!val) disconnectLayer(activeLayer.id)
            else connectLayers(activeLayer.id, val)
          }}
        >
          <option value="">Not connected</option>
          {project.layers
            .filter((l) => l.id !== activeLayer.id)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </select>
      </div>

      <div className={appStyles.divider} />

      {/* ── Gauge / sizing, scoped to the active layer ──
          Keyed by layer id so switching layers remounts the wizard with
          fresh local state instead of syncing it via an effect. GaugeWizard
          manages its own internal sections/eyebrows, so it isn't wrapped
          in another .section here. */}
      <GaugeWizard
        key={activeLayer.id}
        layer={activeLayer}
        project={project}
        onApply={applyLayerSizes}
      />
    </div>
  )
}

function LayerRow({
  layer,
  active,
  removable,
  onSelect,
  onRename,
  onRemove,
}: {
  layer: Layer
  active: boolean
  removable: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onRemove: () => void
}) {
  const rename = useInlineRename(layer.name, onRename)

  return (
    <EntityRow active={active}>
      <EntityRow.Main onClick={onSelect}>
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
            <EntityRow.Name>{layer.name}</EntityRow.Name>
          )}
          <EntityRow.Meta>
            {layer.width} × {layer.height} st · {layer.cmWidth} × {layer.cmHeight} cm
            {layer.gaugeOverride && <EntityRow.Badge>override</EntityRow.Badge>}
          </EntityRow.Meta>
        </EntityRow.Body>
      </EntityRow.Main>
      <EntityRow.Actions>
        {layer.connectedLayerId ? (
          <LuLink2 size={13} strokeWidth={2} className={styles.linkedIcon} title="Connected" />
        ) : (
          <LuUnlink size={13} strokeWidth={2} className={styles.unlinkedIcon} />
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
        {removable && (
          <IconButton
            variant="danger"
            title="Delete layer"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <LuTrash2 size={13} strokeWidth={2} />
          </IconButton>
        )}
      </EntityRow.Actions>
    </EntityRow>
  )
}
