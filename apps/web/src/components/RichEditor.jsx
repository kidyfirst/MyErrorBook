import { useEffect, useMemo, useRef, useState } from 'react'
import { MathfieldElement } from 'mathlive'
import { Eraser, Maximize2, Minimize2, Minus, Plus, Trash2 } from 'lucide-react'
import tinymce from 'tinymce/tinymce'
import 'tinymce/icons/default'
import 'tinymce/themes/silver'
import 'tinymce/plugins/code'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/table'
import 'tinymce/plugins/paste'
import 'tinymce/plugins/preview'
import 'tinymce/skins/ui/oxide/skin.min.css'
import 'tinymce/skins/ui/oxide/content.min.css'
import 'tinymce/skins/content/default/content.min.css'

MathfieldElement.fontsDirectory = '/mathlive-fonts'

const demoContent = `
  <p>解方程：</p>
  <p><strong>2x + 5 = 17</strong></p>
  <p>点击工具栏“公式”插入数学公式，双击公式图片可继续编辑。</p>
`

let pluginRegistered = false
let mathJaxPromise = null

export function RichEditor({
  purpose = 'demo',
  title = '富文本编辑器',
  description,
  value,
  onChange,
  placeholder = '请输入答题过程，支持文字、换行、表格和数学公式。',
  className = '',
  contextTitle,
  contextText,
  showPreview = false,
  previewTitle = '最终预览',
}) {
  const editorHostId = useMemo(() => `rich-editor-${Math.random().toString(36).slice(2)}`, [])
  const editorRef = useRef(null)
  const mathFieldRef = useRef(null)
  const previewRef = useRef(null)
  const controlled = value !== undefined
  const [internalContent, setInternalContent] = useState(controlled ? '' : demoContent)
  const [dialog, setDialog] = useState(null)
  const [latex, setLatex] = useState('\\frac{1}{2}x^2')
  const [fontSize, setFontSize] = useState(purpose === 'draft' ? 15 : 16)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const content = controlled ? value : internalContent

  useEffect(() => {
    registerMathLiveFormulaPlugin()
    const host = document.getElementById(editorHostId)
    if (!host) return undefined

    tinymce.init({
      target: host,
      height: '100%',
      menubar: false,
      skin: false,
      content_css: false,
      branding: false,
      resize: false,
      placeholder,
      plugins: 'lists link table paste preview code mathliveFormula',
      toolbar: 'mathliveFormula | undo redo | bold italic underline | bullist numlist | table link | code preview',
      toolbar_mode: 'wrap',
      content_style: buildEditorContentStyle(fontSize),
      setup(editor) {
        editorRef.current = editor
        editor.on('init', () => {
          editor.setContent(content || '')
        })
        editor.on('change keyup setcontent undo redo input', () => {
          updateContent(editor.getContent())
        })
      },
    })

    return () => {
      const editor = tinymce.get(editorHostId)
      if (editor) editor.remove()
      if (editorRef.current?.id === editorHostId) editorRef.current = null
    }
  }, [editorHostId])

  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.initialized && editor.getContent() !== (content || '')) {
      editor.setContent(content || '')
    }
  }, [content])

  useEffect(() => {
    const editor = editorRef.current
    if (editor?.dom) {
      editor.dom.setStyle(editor.getBody(), 'fontSize', `${fontSize}px`)
    }
  }, [fontSize])

  useEffect(() => {
    function handleOpenFormula(event) {
      const nextDialog = event.detail
      setDialog(nextDialog)
      setLatex(nextDialog.latex || '\\frac{1}{2}x^2')
      requestAnimationFrame(() => {
        if (mathFieldRef.current) {
          mathFieldRef.current.value = nextDialog.latex || '\\frac{1}{2}x^2'
          mathFieldRef.current.focus()
        }
      })
    }
    window.addEventListener('mathlive-formula:open', handleOpenFormula)
    return () => window.removeEventListener('mathlive-formula:open', handleOpenFormula)
  }, [])

  useEffect(() => {
    if (showPreview) renderPreviewMath(previewRef.current)
  }, [content, showPreview])

  function updateContent(nextContent) {
    if (!controlled) setInternalContent(nextContent)
    onChange?.(nextContent)
  }

  function focusEditor() {
    requestAnimationFrame(() => editorRef.current?.focus())
  }

  function clearAll() {
    const editor = editorRef.current
    editor?.setContent('')
    updateContent('')
    focusEditor()
  }

  function clearSelection() {
    const editor = editorRef.current
    if (!editor) {
      updateContent('')
      return
    }
    editor.focus()
    const selectedHtml = editor.selection.getContent()
    if (selectedHtml) {
      editor.selection.setContent('')
    } else {
      editor.execCommand('Delete')
    }
    updateContent(editor.getContent())
  }

  function syncFormulaLatex(event) {
    setLatex(event.currentTarget.value)
  }

  async function insertOrReplaceFormula() {
    if (!dialog) return
    const editor = tinymce.get(dialog.editorId)
    if (!editor) return
    const html = await buildFormulaImageHtml(latex)
    replaceFormulaImage(editor, dialog.target, html)
    updateContent(editor.getContent())
    setDialog(null)
  }

  const editorPanel = (
    <section
      className={[
        'rich-editor',
        `rich-editor-${purpose}`,
        isFullscreen ? 'fullscreen' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <header className="rich-editor-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="rich-editor-actions">
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

      {isFullscreen && contextText && (
        <section className="fullscreen-context" aria-label={contextTitle || '当前题目'}>
          <span>{contextTitle || '当前题目'}</span>
          <p>{contextText}</p>
        </section>
      )}

      <div className="rich-editor-body">
        <textarea id={editorHostId} />
      </div>
    </section>
  )

  return (
    <>
      {showPreview ? (
        <section className="panel rich-math-demo">
          <div className="rich-math-layout">
            {editorPanel}
            <aside className="rich-preview-pane">
              <h2>{previewTitle}</h2>
              <div
                ref={previewRef}
                className="mathjax-preview"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </aside>
          </div>
        </section>
      ) : editorPanel}

      {dialog && (
        <div className="formula-dialog-backdrop">
          <div className="formula-dialog" role="dialog" aria-modal="true" aria-label="编辑数学公式">
            <header>
              <h2>编辑数学公式</h2>
              <button type="button" onClick={() => setDialog(null)}>关闭</button>
            </header>
            <math-field
              ref={mathFieldRef}
              className="formula-mathlive-field"
              onInput={syncFormulaLatex}
              math-virtual-keyboard-policy="auto"
              smart-fence="true"
            />
            <label>
              LaTeX
              <textarea
                value={latex}
                onInput={(event) => {
                  const next = event.currentTarget.value
                  setLatex(next)
                  if (mathFieldRef.current) mathFieldRef.current.value = next
                }}
              />
            </label>
            <footer>
              <button type="button" onClick={() => setDialog(null)}>取消</button>
              <button type="button" className="primary" onClick={insertOrReplaceFormula}>插入公式</button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}

function buildEditorContentStyle(fontSize) {
  return `
    body { font-family: Inter, system-ui, sans-serif; font-size: ${fontSize}px; line-height: 1.65; }
    body, p { margin-top: 0; }
    img.math-formula-svg { max-width: 100%; vertical-align: middle; cursor: pointer; }
    img.math-formula-svg[data-latex] { outline: 1px solid transparent; border-radius: 4px; }
    img.math-formula-svg[data-latex]:hover { outline-color: #9db2d5; }
  `
}

function replaceFormulaImage(editor, target, html) {
  if (target && editor.dom.getRoot().contains(target)) {
    editor.dom.setOuterHTML(target, html)
    return
  }
  editor.insertContent(html)
}

function registerMathLiveFormulaPlugin() {
  if (pluginRegistered) return
  pluginRegistered = true
  tinymce.PluginManager.add('mathliveFormula', function mathliveFormulaPlugin(editor) {
    function openFormulaDialog(target = null) {
      const selected = target || editor.selection.getNode()
      const formulaNode = selected?.classList?.contains('math-formula-svg') ? selected : null
      window.dispatchEvent(new CustomEvent('mathlive-formula:open', {
        detail: {
          editorId: editor.id,
          latex: formulaNode?.getAttribute('data-latex') || '',
          target: formulaNode,
        },
      }))
    }

    editor.ui.registry.addButton('mathliveFormula', {
      text: '公式',
      tooltip: '插入或编辑数学公式',
      onAction: () => openFormulaDialog(),
    })

    editor.on('dblclick', (event) => {
      if (event.target?.classList?.contains('math-formula-svg')) {
        openFormulaDialog(event.target)
      }
    })

    return {
      getMetadata: () => ({
        name: 'MathLive Formula',
        url: 'https://github.com/arnog/mathlive',
      }),
    }
  })
}

async function ensureMathJax() {
  if (!mathJaxPromise) {
    window.MathJax = window.MathJax || {
      startup: { typeset: false },
      tex: { inlineMath: [['\\(', '\\)'], ['$', '$']], displayMath: [['\\[', '\\]'], ['$$', '$$']] },
      svg: { fontCache: 'none' },
    }
    mathJaxPromise = import('mathjax/tex-svg.js').then(() => window.MathJax.startup.promise)
  }
  await mathJaxPromise
  return window.MathJax
}

async function buildFormulaImageHtml(latex) {
  const mathjax = await ensureMathJax()
  const svgNode = mathjax.tex2svg(latex, { display: false })
  const svg = svgNode.querySelector('svg')
  const svgText = new XMLSerializer().serializeToString(svg)
  const src = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgText)))}`
  return `<img class="math-formula-svg" data-latex="${escapeHtml(latex)}" src="${src}" alt="${escapeHtml(latex)}" />`
}

async function renderPreviewMath(node) {
  if (!node) return
  const mathjax = await ensureMathJax()
  await mathjax.typesetPromise([node])
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
