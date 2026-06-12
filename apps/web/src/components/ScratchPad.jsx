import { useEffect, useRef, useState } from 'react'
import { MathfieldElement } from 'mathlive'
import { ReactSketchCanvas } from 'react-sketch-canvas'
import {
  Brush,
  Eraser,
  Expand,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react'
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
  const mathFieldRef = useRef(null)
  const latexSourceRef = useRef(null)
  const canvasRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tool, setTool] = useState('pen')
  const [zoom, setZoom] = useState(1)
  const [fontSize, setFontSize] = useState(16)
  const isDraft = purpose === 'draft'

  function updateValue(nextValue) {
    onChange(nextValue)
  }

  function selectTool(nextTool) {
    setTool(nextTool)
    canvasRef.current?.eraseMode(nextTool === 'eraser')
  }

  function insertMathSnippet(snippet) {
    const el = mathFieldRef.current
    if (!el) {
      updateValue(`${value}${value ? ' ' : ''}${snippet}`)
      return
    }
    el.focus()
    el.insert(snippet)
    updateValue(el.value)
  }

  useEffect(() => {
    if (isDraft) return
    const el = mathFieldRef.current
    if (el && el.value !== value) {
      el.value = value || ''
    }
  }, [isDraft, value])

  useEffect(() => {
    if (isDraft) return undefined
    const source = latexSourceRef.current
    if (!source) return undefined
    function handleInput(event) {
      syncLatexSource(event.currentTarget.value)
    }
    source.addEventListener('input', handleInput)
    return () => source.removeEventListener('input', handleInput)
  }, [isDraft])

  function syncMathValue(event) {
    updateValue(event.currentTarget.value)
  }

  function syncLatexSource(nextValue) {
    updateValue(nextValue)
    if (mathFieldRef.current && mathFieldRef.current.value !== nextValue) {
      mathFieldRef.current.value = nextValue
    }
  }

  function focusMathField() {
    requestAnimationFrame(() => {
      mathFieldRef.current?.focus()
    })
  }

  function clearAll() {
    if (isDraft) {
      canvasRef.current?.resetCanvas()
      updateValue('')
      return
    }
    updateValue('')
    if (mathFieldRef.current) mathFieldRef.current.value = ''
    focusMathField()
  }

  function clearSelection() {
    if (isDraft) {
      selectTool('eraser')
      return
    }
    const el = mathFieldRef.current
    if (!el) {
      clearAll()
      return
    }
    el.focus()
    el.executeCommand('deleteBackward')
    updateValue(el.value)
  }

  async function syncSketchValue(paths) {
    if (!isDraft) return
    updateValue(JSON.stringify({ format: 'react-sketch-canvas-paths-v1', paths }))
  }

  function fitCanvas() {
    setZoom(1)
  }

  function zoomOut() {
    setZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))
  }

  function zoomIn() {
    setZoom((current) => Math.min(1.8, Number((current + 0.1).toFixed(2))))
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
          {isDraft && (
            <>
              <button
                type="button"
                className={tool === 'pen' ? 'active-tool' : ''}
                onClick={() => selectTool('pen')}
              >
                <Brush size={15} />
                笔
              </button>
              <button
                type="button"
                className={tool === 'eraser' ? 'active-tool' : ''}
                onClick={clearSelection}
              >
                <Eraser size={15} />
                局部清除
              </button>
            </>
          )}
          <button type="button" onClick={isDraft ? zoomOut : () => setFontSize((size) => Math.max(13, size - 1))}>
            <Minus size={15} />
            缩小
          </button>
          <button type="button" onClick={isDraft ? zoomIn : () => setFontSize((size) => Math.min(28, size + 1))}>
            <Plus size={15} />
            放大
          </button>
          {isDraft && (
            <>
              <button type="button" onClick={fitCanvas}>
                <Expand size={15} />
                适应
              </button>
              <button type="button" onClick={() => canvasRef.current?.undo()}>
                <RotateCcw size={15} />
                撤销
              </button>
              <button type="button" onClick={() => canvasRef.current?.redo()}>
                <RotateCw size={15} />
                重做
              </button>
            </>
          )}
          {!isDraft && (
            <button type="button" onClick={clearSelection}>
              <Eraser size={15} />
              局部清除
            </button>
          )}
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

      {!isDraft && <MathToolbar onInsert={insertMathSnippet} />}

      {isDraft ? (
        <div className="sketch-stage" style={{ '--scratch-zoom': zoom }}>
          <ReactSketchCanvas
            ref={canvasRef}
            className="draft-canvas"
            width="100%"
            height="100%"
            strokeWidth={4}
            eraserWidth={18}
            strokeColor="#172033"
            canvasColor="#fffdf7"
            onChange={syncSketchValue}
          />
        </div>
      ) : (
        <div className="answer-editor">
          <math-field
            ref={mathFieldRef}
            className="answer-pad answer-input"
            style={{ fontSize }}
            onInput={syncMathValue}
            math-virtual-keyboard-policy="auto"
            smart-fence="true"
            placeholder={placeholder}
          />
          <label className="latex-source">
            LaTeX 源码
            <textarea
              ref={latexSourceRef}
              className="latex-source-input"
              value={value}
              onInput={(event) => syncLatexSource(event.currentTarget.value)}
              placeholder="也可以直接用键盘输入 LaTeX，例如 \\frac{1}{2}"
            />
          </label>
        </div>
      )}
    </section>
  )
}
