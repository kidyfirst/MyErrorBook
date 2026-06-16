import { useEffect, useRef, useState } from 'react'
import { MathfieldElement } from 'mathlive'
import { Eraser, Maximize2, Minimize2, Minus, Plus, Trash2 } from 'lucide-react'
import { MathToolbar } from './MathToolbar.jsx'

MathfieldElement.fontsDirectory = '/mathlive-fonts'

export function ScratchPad({
  purpose,
  title,
  description,
  value,
  onChange,
  placeholder,
  className = '',
}) {
  const panelRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(purpose === 'draft' ? 15 : 17)
  const isDraft = purpose === 'draft'

  useEffect(() => {
    const panel = panelRef.current
    const nextValue = normalizePanelValue(value)
    if (panel && panel.value !== nextValue) {
      panel.value = nextValue
    }
  }, [value])

  function updateValue(nextValue) {
    onChange(nextValue)
  }

  function focusPanel() {
    requestAnimationFrame(() => panelRef.current?.focus())
  }

  function syncPanelLatex(event) {
    updateValue(event.currentTarget.value)
  }

  function insertMathSnippet(snippet) {
    const panel = panelRef.current
    if (!panel) {
      updateValue(`${normalizePanelValue(value)}${snippet}`)
      return
    }
    panel.focus()
    panel.insert(snippet)
    updateValue(panel.value)
  }

  function clearAll() {
    updateValue('')
    if (panelRef.current) panelRef.current.value = ''
    focusPanel()
  }

  function clearSelection() {
    const panel = panelRef.current
    if (!panel) {
      clearAll()
      return
    }
    panel.focus()
    panel.executeCommand('deleteBackward')
    updateValue(panel.value)
  }

  return (
    <section
      className={[
        'scratch-pad',
        `scratch-pad-${purpose}`,
        isFullscreen ? 'fullscreen' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <header className="scratch-pad-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="scratch-pad-actions">
          <button type="button" onClick={() => setFontSize((size) => Math.max(13, size - 1))}>
            <Minus size={15} />
            缩小
          </button>
          <button type="button" onClick={() => setFontSize((size) => Math.min(30, size + 1))}>
            <Plus size={15} />
            放大
          </button>
          <button type="button" onClick={clearSelection}>
            <Eraser size={15} />
            局部清除
          </button>
          <button type="button" onClick={clearAll}>
            <Trash2 size={15} />
            整体清除
          </button>
          <button type="button" onClick={() => setIsFullscreen((current) => !current)}>
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            全屏
          </button>
        </div>
      </header>

      <MathToolbar compact={isDraft} onInsert={insertMathSnippet} />

      <math-field
        ref={panelRef}
        className={[
          'scratch-panel-input',
          isDraft ? 'draft-panel-input' : 'answer-panel-input',
        ].join(' ')}
        style={{ fontSize }}
        onInput={syncPanelLatex}
        math-virtual-keyboard-policy="auto"
        smart-fence="true"
        placeholder={placeholder}
      />
    </section>
  )
}

function normalizePanelValue(value) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    if (parsed?.format === 'draft-text-and-sketch-v1') return parsed.text || ''
    if (parsed?.format === 'react-sketch-canvas-paths-v1') return ''
  } catch {
    return value
  }
  return value
}
