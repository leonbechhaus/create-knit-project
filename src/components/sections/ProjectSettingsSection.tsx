import { LuSave } from 'react-icons/lu'

import appStyles from '../../App.module.css'
import { Button } from '../ui/Button'
import { useKnittingStore } from '../../store/useKnittingStore'

// "Config" tab body of the project panel — project-wide defaults (name
// summary + default gauge) plus the save action. Layer-scoped sizing lives
// in LayerPanel instead.
export function ProjectSettingsSection() {
  const { project, updateProjectGauge, saveProject } = useKnittingStore()

  return (
    <div className={appStyles.tabPanel}>
      <div className={appStyles.section}>
        <p className={appStyles.eyebrow}>Overview</p>
        <div className={appStyles.projectSummary}>
          <h3 className={appStyles.projectSummaryName}>{project.name}</h3>
          <span className={appStyles.projectSummaryMeta}>
            {project.layers.length} layer{project.layers.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className={appStyles.divider} />

      <div className={appStyles.section}>
        <p className={appStyles.eyebrow}>Gauge</p>
        <p className={appStyles.hintText}>
          This is the project-wide default gauge. Each layer can optionally override it in the
          Layers tab.
        </p>
        <div className={appStyles.sliderGroup}>
          <label className={appStyles.gaugeFieldRow}>
            <span>Stitches / 10 cm (horizontal)</span>
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={project.gauge.stitchGauge}
              onChange={(e) => updateProjectGauge({ stitchGauge: Number(e.target.value) })}
            />
          </label>
          <label className={appStyles.gaugeFieldRow}>
            <span>Rows / 10 cm (vertical)</span>
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={project.gauge.rowGauge}
              onChange={(e) => updateProjectGauge({ rowGauge: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>

      <div className={appStyles.divider} />

      <div className={appStyles.actionStack}>
        <Button
          variant="primary"
          fullWidth
          icon={<LuSave size={15} strokeWidth={2} />}
          onClick={() => void saveProject()}
        >
          Save project
        </Button>
      </div>
    </div>
  )
}
