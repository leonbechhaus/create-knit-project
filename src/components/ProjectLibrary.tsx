import { useState } from 'react'
import { LuPlus, LuX } from 'react-icons/lu'

import type { ProjectRecord } from '../db/knitDb'
import { useKnittingStore } from '../store/useKnittingStore'
import appStyles from '../App.module.css'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import { EntityRow } from './ui/EntityRow'
import { NumberField } from './ui/NumberField'
import { SectionHeader } from './ui/SectionHeader'
import styles from './ProjectLibrary.module.css'

export function ProjectLibrary() {
  const { savedProjects, setActiveProject, createNewProject, project: active } = useKnittingStore()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [stitchGauge, setStitchGauge] = useState(24)
  const [rowGauge, setRowGauge] = useState(32)
  const [targetW, setTargetW] = useState(15)
  const [targetH, setTargetH] = useState(20)

  const handleCreate = () => {
    if (!name.trim()) return
    createNewProject(
      name.trim(),
      { stitchGauge, rowGauge },
      { targetWidthCm: targetW, targetHeightCm: targetH },
    )
    setShowForm(false)
    setName('')
  }

  return (
    <div className={appStyles.tabPanel}>
      <div className={appStyles.section}>
        <SectionHeader>
          <SectionHeader.Eyebrow>Projects</SectionHeader.Eyebrow>
          <SectionHeader.Actions>
            <Button
              variant="outline"
              size="sm"
              icon={showForm ? <LuX size={13} /> : <LuPlus size={13} strokeWidth={2.5} />}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? 'Cancel' : 'New'}
            </Button>
          </SectionHeader.Actions>
        </SectionHeader>

        {showForm && (
          <div className={styles.form}>
            <input
              className={styles.nameInput}
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className={styles.formRow}>
              <NumberField
                label="St/10"
                unit="H"
                min={1}
                max={100}
                step={0.5}
                value={stitchGauge}
                onChange={(e) => setStitchGauge(Number(e.target.value))}
              />
              <NumberField
                label="R/10"
                unit="V"
                min={1}
                max={100}
                step={0.5}
                value={rowGauge}
                onChange={(e) => setRowGauge(Number(e.target.value))}
              />
            </div>
            <div className={styles.formRow}>
              <NumberField
                label="W"
                unit="cm"
                min={1}
                max={500}
                step={0.5}
                value={targetW}
                onChange={(e) => setTargetW(Number(e.target.value))}
              />
              <NumberField
                label="H"
                unit="cm"
                min={1}
                max={500}
                step={0.5}
                value={targetH}
                onChange={(e) => setTargetH(Number(e.target.value))}
              />
            </div>
            <Button variant="primary" fullWidth onClick={handleCreate}>
              Create project
            </Button>
          </div>
        )}
      </div>

      <div className={appStyles.divider} />

      <div className={appStyles.section}>
        <div className={styles.list}>
          {savedProjects.length === 0 && !showForm && (
            <EmptyState>No saved projects yet.</EmptyState>
          )}
          {savedProjects.map((rec) => (
            <ProjectCard
              key={rec.id}
              record={rec}
              active={rec.id === active.id}
              onSelect={() => setActiveProject(rec)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({
  record,
  active,
  onSelect,
}: {
  record: ProjectRecord
  active: boolean
  onSelect: () => void
}) {
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(
    new Date(record.updatedAt),
  )
  const layerCount = record.layers?.length ?? 1
  return (
    <EntityRow active={active}>
      <EntityRow.Main onClick={onSelect}>
        <EntityRow.Body>
          <EntityRow.Name>{record.name}</EntityRow.Name>
          <EntityRow.Meta>
            {layerCount} layer{layerCount === 1 ? '' : 's'} · {record.gauge?.stitchGauge ?? '–'} st
            / {record.gauge?.rowGauge ?? '–'} rows per 10cm
          </EntityRow.Meta>
          <span className={styles.cardDate}>{date}</span>
        </EntityRow.Body>
      </EntityRow.Main>
    </EntityRow>
  )
}
