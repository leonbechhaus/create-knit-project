import { useEffect, useRef } from 'react'

import type { ToolKind } from '../domain/project'

/**
 * Semantic hotkey actions — the vocabulary consumers react to. Keeping this
 * as a discriminated union (rather than raw `KeyboardEvent`s) means the key
 * mapping can change freely without touching anything that *applies* state.
 */
export type KeystrokeAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'zoom-in' }
  | { type: 'zoom-out' }
  | { type: 'zoom-reset' }
  | { type: 'select-tool'; tool: ToolKind }
  | { type: 'flip-y' }
  | { type: 'toggle-onion-skin' }

const EVENT_NAME = 'knit:keystroke'

// Module-level bus (plain EventTarget) so the emitter and any number of
// listeners can be mounted independently without prop-drilling a callback
// through the component tree.
const bus = new EventTarget()

// Aseprite/Photoshop-style single-letter tool hotkeys — familiar to anyone
// coming from a pixel-art or paint tool. `L` is Line (not Lasso, since Line
// is the more frequent action here) so Lasso borrows Aseprite's `Q`, and
// Stamp uses `S` to match Photoshop's Clone Stamp.
const TOOL_HOTKEYS: Record<string, ToolKind> = {
  b: 'paint',
  e: 'erase',
  g: 'fill',
  l: 'line',
  m: 'select',
  q: 'lasso',
  s: 'stamp',
  i: 'eyedropper',
}

function emit(action: KeystrokeAction) {
  bus.dispatchEvent(new CustomEvent<KeystrokeAction>(EVENT_NAME, { detail: action }))
}

/**
 * Mounts the single window `keydown` listener, translates raw keys into
 * `KeystrokeAction`s, and emits them on the shared bus. This owns *all*
 * hotkey -> action mapping plus the "don't hijack typing" guard, so it
 * should be mounted exactly once near the app root (in `App.tsx`).
 * Consumers subscribe via `useKeystrokeAction` and never see raw keys.
 */
export function useKeystrokeEmitter() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never hijack typing in text fields (rename inputs, pattern names,
      // the row-note textarea, etc.).
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && !e.shiftKey && key === 'z') {
        e.preventDefault()
        emit({ type: 'undo' })
        return
      }
      if (mod && ((e.shiftKey && key === 'z') || key === 'y')) {
        e.preventDefault()
        emit({ type: 'redo' })
        return
      }
      if (mod) return // no further single-letter bindings while a modifier is held

      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        emit({ type: 'zoom-in' })
        return
      }
      if (e.key === '-') {
        e.preventDefault()
        emit({ type: 'zoom-out' })
        return
      }
      if (e.key === '0') {
        e.preventDefault()
        emit({ type: 'zoom-reset' })
        return
      }
      if (e.altKey) return

      const tool = TOOL_HOTKEYS[key]
      if (tool) {
        e.preventDefault()
        emit({ type: 'select-tool', tool })
        return
      }
      if (key === 'f') {
        e.preventDefault()
        emit({ type: 'flip-y' })
        return
      }
      if (key === 'o') {
        e.preventDefault()
        emit({ type: 'toggle-onion-skin' })
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/**
 * Subscribes to semantic keystroke actions emitted by `useKeystrokeEmitter`.
 * The handler is kept in a ref so passing a fresh inline callback each
 * render doesn't churn the subscription.
 */
export function useKeystrokeAction(handler: (action: KeystrokeAction) => void) {
  const handlerRef = useRef(handler)
  // Keep the ref current without touching it during render (refs are for
  // effects/handlers, not render output).
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const listener = (e: Event) => handlerRef.current((e as CustomEvent<KeystrokeAction>).detail)
    bus.addEventListener(EVENT_NAME, listener)
    return () => bus.removeEventListener(EVENT_NAME, listener)
  }, [])
}
