import { useState } from 'react'

import appStyles from '../App.module.css'
import { effectiveGauge, rawStitches, resolveJointRounding } from '../domain/project'
import type { GaugeConfig, Layer, Project } from '../domain/project'
import type { LayerSizeUpdate } from '../store/useKnittingStore'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import styles from './GaugeWizard.module.css'

type Props = {
  layer: Layer
  project: Project
  onApply: (updates: LayerSizeUpdate[]) => void
}

type Axis = 'width' | 'height'

type Conflict = {
  axis: Axis
  raw: number // e.g. 37.2
  floor: number // 37
  ceil: number // 38
  resolved: number | null
}

type JointPreview = {
  other: Layer
  thisResult: { width: number; height: number }
  otherResult: { width: number; height: number }
  updates: LayerSizeUpdate[]
}

export function GaugeWizard({ layer, project, onApply }: Props) {
  const [overrideEnabled, setOverrideEnabled] = useState(layer.gaugeOverride !== null)
  const [stitchGauge, setStitchGauge] = useState((layer.gaugeOverride ?? project.gauge).stitchGauge)
  const [rowGauge, setRowGauge] = useState((layer.gaugeOverride ?? project.gauge).rowGauge)
  const [targetWidthCm, setTargetWidthCm] = useState(layer.targetWidthCm)
  const [targetHeightCm, setTargetHeightCm] = useState(layer.targetHeightCm)

  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [jointPreview, setJointPreview] = useState<JointPreview | null>(null)
  const [modalMode, setModalMode] = useState<'none' | 'independent' | 'joint'>('none')

  const connectedLayer = layer.connectedLayerId
    ? (project.layers.find((l) => l.id === layer.connectedLayerId) ?? null)
    : null

  const currentGauge = (): GaugeConfig =>
    overrideEnabled ? { stitchGauge, rowGauge } : project.gauge

  const buildIndependentUpdate = (width: number, height: number): LayerSizeUpdate => ({
    layerId: layer.id,
    width,
    height,
    gaugeOverride: overrideEnabled ? { stitchGauge, rowGauge } : null,
    targetWidthCm,
    targetHeightCm,
  })

  const handleCalculate = () => {
    const gauge = currentGauge()
    const rawW = rawStitches(targetWidthCm, gauge.stitchGauge)
    const rawH = rawStitches(targetHeightCm, gauge.rowGauge)

    if (connectedLayer) {
      const otherGauge = effectiveGauge(connectedLayer, project)
      const rawWOther = rawStitches(connectedLayer.targetWidthCm, otherGauge.stitchGauge)
      const rawHOther = rawStitches(connectedLayer.targetHeightCm, otherGauge.rowGauge)

      const [wThis, wOther] = resolveJointRounding([rawW, rawWOther])
      const [hThis, hOther] = resolveJointRounding([rawH, rawHOther])

      const updates: LayerSizeUpdate[] = [
        buildIndependentUpdate(wThis, hThis),
        {
          layerId: connectedLayer.id,
          width: wOther,
          height: hOther,
          gaugeOverride: connectedLayer.gaugeOverride,
          targetWidthCm: connectedLayer.targetWidthCm,
          targetHeightCm: connectedLayer.targetHeightCm,
        },
      ]

      const anyFractional = ![rawW, rawH, rawWOther, rawHOther].every(Number.isInteger)

      if (!anyFractional) {
        onApply(updates)
        return
      }

      setJointPreview({
        other: connectedLayer,
        thisResult: { width: wThis, height: hThis },
        otherResult: { width: wOther, height: hOther },
        updates,
      })
      setModalMode('joint')
      return
    }

    runIndependentCalculation(rawW, rawH)
  }

  const runIndependentCalculation = (rawW: number, rawH: number) => {
    const newConflicts: Conflict[] = []
    if (!Number.isInteger(rawW)) {
      newConflicts.push({
        axis: 'width',
        raw: rawW,
        floor: Math.floor(rawW),
        ceil: Math.ceil(rawW),
        resolved: null,
      })
    }
    if (!Number.isInteger(rawH)) {
      newConflicts.push({
        axis: 'height',
        raw: rawH,
        floor: Math.floor(rawH),
        ceil: Math.ceil(rawH),
        resolved: null,
      })
    }

    if (newConflicts.length > 0) {
      setConflicts(newConflicts)
      setModalMode('independent')
    } else {
      onApply([buildIndependentUpdate(Math.round(rawW), Math.round(rawH))])
    }
  }

  const resolveIndependently = () => {
    const gauge = currentGauge()
    const rawW = rawStitches(targetWidthCm, gauge.stitchGauge)
    const rawH = rawStitches(targetHeightCm, gauge.rowGauge)
    setJointPreview(null)
    runIndependentCalculation(rawW, rawH)
  }

  const resolveConflict = (axis: Axis, value: number) => {
    setConflicts((prev) => prev.map((c) => (c.axis === axis ? { ...c, resolved: value } : c)))
  }

  const handleIndependentApply = () => {
    const gauge = currentGauge()
    const resolvedW =
      conflicts.find((c) => c.axis === 'width')?.resolved ??
      Math.round(rawStitches(targetWidthCm, gauge.stitchGauge))
    const resolvedH =
      conflicts.find((c) => c.axis === 'height')?.resolved ??
      Math.round(rawStitches(targetHeightCm, gauge.rowGauge))
    onApply([buildIndependentUpdate(resolvedW, resolvedH)])
    setModalMode('none')
    setConflicts([])
  }

  const handleJointApply = () => {
    if (!jointPreview) return
    onApply(jointPreview.updates)
    setModalMode('none')
    setJointPreview(null)
  }

  const allResolved = conflicts.every((c) => c.resolved !== null)
  const effGauge = currentGauge()

  return (
    <div className={styles.wizard}>
      {/* ── Gauge ── */}
      <div className={styles.section}>
        <div className={styles.rowHeader}>
          <p className={`${appStyles.eyebrow} ${styles.labelReset}`}>Gauge</p>
          <label className={styles.overrideToggle}>
            <input
              type="checkbox"
              checked={overrideEnabled}
              onChange={(e) => {
                const enabled = e.target.checked
                setOverrideEnabled(enabled)
                if (!enabled) {
                  setStitchGauge(project.gauge.stitchGauge)
                  setRowGauge(project.gauge.rowGauge)
                }
              }}
            />
            Override for this layer
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Stitches / 10 cm</label>
          <span className={styles.hint}>horizontal</span>
          <input
            className={styles.numInput}
            type="number"
            min={1}
            max={100}
            step={0.5}
            disabled={!overrideEnabled}
            value={effGauge.stitchGauge}
            onChange={(e) => setStitchGauge(Number(e.target.value))}
          />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Rows / 10 cm</label>
          <span className={styles.hint}>vertical</span>
          <input
            className={styles.numInput}
            type="number"
            min={1}
            max={100}
            step={0.5}
            disabled={!overrideEnabled}
            value={effGauge.rowGauge}
            onChange={(e) => setRowGauge(Number(e.target.value))}
          />
        </div>
      </div>

      {/* ── Target size ── */}
      <div className={styles.section}>
        <p className={appStyles.eyebrow}>Target size</p>
        <div className={styles.row}>
          <label className={styles.label}>Width</label>
          <span className={styles.hint}>cm</span>
          <input
            className={styles.numInput}
            type="number"
            min={1}
            max={500}
            step={0.5}
            value={targetWidthCm}
            onChange={(e) => setTargetWidthCm(Number(e.target.value))}
          />
        </div>
        <div className={styles.row}>
          <label className={styles.label}>Height</label>
          <span className={styles.hint}>cm</span>
          <input
            className={styles.numInput}
            type="number"
            min={1}
            max={500}
            step={0.5}
            value={targetHeightCm}
            onChange={(e) => setTargetHeightCm(Number(e.target.value))}
          />
        </div>
      </div>

      {connectedLayer && (
        <p className={styles.connectedNote}>
          Connected to <strong>{connectedLayer.name}</strong> — stitch rounding will be resolved
          jointly.
        </p>
      )}

      {/* ── Calculate ── */}
      <Button variant="primary" fullWidth onClick={handleCalculate}>
        Calculate grid →
      </Button>

      {/* ── Independent conflict modal ── */}
      {modalMode === 'independent' && (
        <Modal onClose={() => setModalMode('none')}>
          <Modal.Header>
            <Modal.Title>Stitch count conflict</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <p className={styles.modalDesc}>
              Your target dimensions don't divide into whole stitches with the current gauge. Choose
              how to round each dimension.
            </p>

            <div className={styles.conflicts}>
              {conflicts.map((conflict) => (
                <div key={conflict.axis} className={styles.conflict}>
                  <p className={styles.conflictAxis}>
                    {conflict.axis === 'width' ? 'Width' : 'Height'}
                    <span className={styles.conflictRaw}>{conflict.raw.toFixed(3)} stitches</span>
                  </p>
                  <div className={styles.conflictChoices}>
                    <button
                      type="button"
                      className={`${styles.choice} ${conflict.resolved === conflict.floor ? styles.choiceActive : ''}`}
                      onClick={() => resolveConflict(conflict.axis, conflict.floor)}
                    >
                      <span className={styles.choiceArrow}>▼</span>
                      <span className={styles.choiceValue}>{conflict.floor}</span>
                      <span className={styles.choiceUnit}>stitches</span>
                    </button>
                    <span className={styles.choiceSep}>or</span>
                    <button
                      type="button"
                      className={`${styles.choice} ${conflict.resolved === conflict.ceil ? styles.choiceActive : ''}`}
                      onClick={() => resolveConflict(conflict.axis, conflict.ceil)}
                    >
                      <span className={styles.choiceArrow}>▲</span>
                      <span className={styles.choiceValue}>{conflict.ceil}</span>
                      <span className={styles.choiceUnit}>stitches</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer stack>
            <Button
              variant="primary"
              fullWidth
              disabled={!allResolved}
              onClick={handleIndependentApply}
            >
              Apply
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* ── Joint resolution modal (connected layers) ── */}
      {modalMode === 'joint' && jointPreview && (
        <Modal onClose={() => setModalMode('none')}>
          <Modal.Header>
            <Modal.Title>Joint stitch resolution</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <p className={styles.modalDesc}>
              <strong>{layer.name}</strong> is connected to{' '}
              <strong>{jointPreview.other.name}</strong>. The target sizes don't divide evenly, so
              we've resolved the rounding across both pieces together — this keeps the combined
              stitch count accurate instead of rounding each piece independently.
            </p>

            <div className={styles.conflicts}>
              <div className={styles.conflict}>
                <p className={styles.conflictAxis}>{layer.name}</p>
                <p className={styles.jointValue}>
                  {jointPreview.thisResult.width} × {jointPreview.thisResult.height} stitches
                </p>
              </div>
              <div className={styles.conflict}>
                <p className={styles.conflictAxis}>{jointPreview.other.name}</p>
                <p className={styles.jointValue}>
                  {jointPreview.otherResult.width} × {jointPreview.otherResult.height} stitches
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer stack>
            <Button variant="primary" fullWidth onClick={handleJointApply}>
              Apply joint resolution
            </Button>
            <Button variant="ghost" fullWidth onClick={resolveIndependently}>
              Resolve independently instead
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}
