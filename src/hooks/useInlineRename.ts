import { useState } from 'react'

/**
 * Shared inline-rename state machine: a row/field shows its static label
 * until `start()` is called, then swaps to an editable draft that commits
 * on blur/Enter or cancels on Escape. Used by every row that supports
 * rename-in-place (layers, pattern units, color swatches) so the
 * start/commit/cancel logic isn't re-implemented per component.
 */
export function useInlineRename(currentValue: string, onCommit: (next: string) => void) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(currentValue)

  const start = () => {
    setDraft(currentValue)
    setRenaming(true)
  }

  const commit = () => {
    if (draft.trim()) onCommit(draft.trim())
    setRenaming(false)
  }

  const cancel = () => setRenaming(false)

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') cancel()
  }

  return { renaming, draft, setDraft, start, commit, cancel, handleKeyDown }
}
