import { useState } from 'react'
import { LuX } from 'react-icons/lu'

import appStyles from '../../App.module.css'
import { IconButton } from '../ui/IconButton'
import { SectionHeader } from '../ui/SectionHeader'
import { LayerPanel } from '../LayerPanel'
import { PatternUnitsPanel } from '../PatternUnitsPanel'
import { ProjectLibrary } from '../ProjectLibrary'
import { ProjectSettingsSection } from './ProjectSettingsSection'
import styles from './ProjectPanel.module.css'

type LeftTab = 'library' | 'layers' | 'settings' | 'patterns'

const TAB_LABEL: Record<LeftTab, string> = {
  library: 'Library',
  layers: 'Layers',
  settings: 'Settings',
  patterns: 'Patterns',
}

// Left offcanvas: project library, layer management, and project-wide
// settings, switched via an in-panel tab bar. Fully self-contained aside
// from open/close, which is orchestrated by the app shell.
export function ProjectPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<LeftTab>('library')

  return (
    <aside
      className={`${appStyles.slidePanel} ${appStyles.slidePanelLeft} ${open ? appStyles.slidePanelOpen : ''}`}
    >
      <div className={appStyles.panelHead}>
        <SectionHeader>
          <SectionHeader.Heading>
            <SectionHeader.Eyebrow>Project</SectionHeader.Eyebrow>
            <SectionHeader.Title>{TAB_LABEL[tab]}</SectionHeader.Title>
          </SectionHeader.Heading>
          <SectionHeader.Actions>
            <IconButton onClick={onClose} aria-label="Close">
              <LuX size={15} strokeWidth={2} />
            </IconButton>
          </SectionHeader.Actions>
        </SectionHeader>
        <div className={styles.tabRow}>
          <button
            type="button"
            className={`${appStyles.tabBtn} ${tab === 'library' ? appStyles.tabBtnActive : ''}`}
            onClick={() => setTab('library')}
          >
            Library
          </button>
          <button
            type="button"
            className={`${appStyles.tabBtn} ${tab === 'settings' ? appStyles.tabBtnActive : ''}`}
            onClick={() => setTab('settings')}
          >
            Config
          </button>
          <button
            type="button"
            className={`${appStyles.tabBtn} ${tab === 'layers' ? appStyles.tabBtnActive : ''}`}
            onClick={() => setTab('layers')}
          >
            Layers
          </button>
          <button
            type="button"
            className={`${appStyles.tabBtn} ${tab === 'patterns' ? appStyles.tabBtnActive : ''}`}
            onClick={() => setTab('patterns')}
          >
            Patterns
          </button>
        </div>
      </div>

      {tab === 'library' && <ProjectLibrary />}
      {tab === 'settings' && <ProjectSettingsSection />}
      {tab === 'layers' && <LayerPanel />}
      {tab === 'patterns' && <PatternUnitsPanel />}
    </aside>
  )
}
