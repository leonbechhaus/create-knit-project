import { useEffect, useState } from 'react'

import styles from './App.module.css'
import { ColorStudioSection } from './components/sections/ColorStudioSection'
import { EditorCanvasSection } from './components/sections/EditorCanvasSection'
import { FabDock } from './components/sections/FabDock'
import { ProjectPanel } from './components/sections/ProjectPanel'
import { ToolbarSection } from './components/sections/ToolbarSection'
import { useKeystrokeAction, useKeystrokeEmitter } from './hooks/useKeystrokeEmitter'
import { useKnittingStore } from './store/useKnittingStore'

function App() {
  const {
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    initProfile,
    setActiveTool,
    flipY,
    setFlipY,
    onionSkinEnabled,
    onionSkinLayerId,
    setOnionSkinEnabled,
    setOnionSkinLayerId,
    project,
  } = useKnittingStore()

  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  useEffect(() => {
    void initProfile()
  }, [initProfile])

  // The emitter owns raw keydown -> semantic action translation; App.tsx
  // just orchestrates what each action does to app state.
  useKeystrokeEmitter()
  useKeystrokeAction((action) => {
    switch (action.type) {
      case 'undo':
        undo()
        break
      case 'redo':
        redo()
        break
      case 'zoom-in':
        zoomIn()
        break
      case 'zoom-out':
        zoomOut()
        break
      case 'zoom-reset':
        resetZoom()
        break
      case 'select-tool':
        setActiveTool(action.tool)
        break
      case 'flip-y':
        setFlipY(!flipY)
        break
      case 'toggle-onion-skin': {
        const otherLayers = project.layers.filter((l) => l.id !== project.activeLayerId)
        if (otherLayers.length === 0) break
        const next = !onionSkinEnabled
        setOnionSkinEnabled(next)
        if (next && !onionSkinLayerId) setOnionSkinLayerId(otherLayers[0]?.id ?? null)
        break
      }
    }
  })

  const toggleLeft = () => {
    setLeftOpen((v) => !v)
    setRightOpen(false)
  }
  const toggleRight = () => {
    setRightOpen((v) => !v)
    setLeftOpen(false)
  }
  const openRight = () => {
    setRightOpen(true)
    setLeftOpen(false)
  }
  const closeAll = () => {
    setLeftOpen(false)
    setRightOpen(false)
  }

  return (
    <div id="app-shell" className={styles.appShell}>
      <ProjectPanel open={leftOpen} onClose={() => setLeftOpen(false)} />
      <ColorStudioSection open={rightOpen} onClose={() => setRightOpen(false)} />

      {(leftOpen || rightOpen) && <div className={styles.panelBackdrop} onClick={closeAll} />}

      <ToolbarSection onOpenColorStudio={openRight} />
      <FabDock
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={toggleLeft}
        onToggleRight={toggleRight}
      />
      <EditorCanvasSection />
    </div>
  )
}

export default App
