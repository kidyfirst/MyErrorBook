import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
const css = readFileSync(join(root, 'src/styles.css'), 'utf8')
let scratchPad = ''
let mathToolbar = ''
let richMathEditor = ''
try {
  scratchPad = readFileSync(join(root, 'src/components/ScratchPad.jsx'), 'utf8')
} catch {
  scratchPad = ''
}
try {
  mathToolbar = readFileSync(join(root, 'src/components/MathToolbar.jsx'), 'utf8')
} catch {
  mathToolbar = ''
}
try {
  richMathEditor = readFileSync(join(root, 'src/components/RichMathEditor.jsx'), 'utf8')
} catch {
  richMathEditor = ''
}

const requirements = [
  ['left menu', app.includes('错题录入') && app.includes('每日一题')],
  ['scratchpad component', scratchPad.includes('export function ScratchPad')],
  ['mathlive dependency', scratchPad.includes('mathlive') && scratchPad.includes('MathfieldElement')],
  ['answer scratchpad', app.includes('purpose="answer"') && scratchPad.includes('answer-panel-input')],
  ['answer panel is one big input', scratchPad.includes('scratch-panel-input') && scratchPad.includes('<math-field') && css.includes('min-height: 240px')],
  ['draft scratchpad', app.includes('purpose="draft"') && app.includes('draft-panel')],
  ['draft fullscreen question context', app.includes('contextText={daily?.questionText}') && scratchPad.includes('fullscreen-context')],
  ['draft panel is one big input', scratchPad.includes('draft-panel-input') && scratchPad.includes('syncPanelLatex')],
  ['multiline derivation input', scratchPad.includes('handlePanelKeyDown') && scratchPad.includes('ensureAlignedEnvironment') && scratchPad.includes('appendAlignedRow')],
  ['page does not scroll', css.includes('overflow: hidden') && css.includes('height: 100vh')],
  ['daily panel flex layout', css.includes('.question-panel') && css.includes('display: flex') && css.includes('flex-direction: column')],
  ['answer input fills remaining height', css.includes('.scratch-pad-answer') && css.includes('flex: 1') && css.includes('min-height: 0')],
  ['input panels scroll internally', css.includes('overflow-y: auto') && css.includes('.draft-panel-input')],
  ['scratchpad controls', scratchPad.includes('全屏') && scratchPad.includes('放大') && scratchPad.includes('缩小')],
  ['scratchpad clearing', scratchPad.includes('整体清除') && scratchPad.includes('局部清除')],
  ['math input toolbar', mathToolbar.includes('math-toolbar') && mathToolbar.includes('插入数学表达式')],
  ['latex snippets', mathToolbar.includes('\\\\frac{}{}') && mathToolbar.includes('\\\\sqrt{}') && mathToolbar.includes('^{}')],
  ['tinymce math demo menu', app.includes("id: 'rich-math-demo'") && app.includes('公式编辑 Demo')],
  ['tinymce5 rich editor', richMathEditor.includes('tinymce/tinymce') && richMathEditor.includes('tinymce.init') && richMathEditor.includes('mathliveFormula')],
  ['mathlive formula plugin', richMathEditor.includes('<math-field') && richMathEditor.includes('openFormulaDialog')],
  ['mathjax svg rendering', richMathEditor.includes('mathjax') && richMathEditor.includes('tex2svg') && richMathEditor.includes('math-formula-svg')],
  ['editable svg formula image', richMathEditor.includes('data-latex') && richMathEditor.includes('dblclick') && richMathEditor.includes('replaceFormulaImage')],
  ['admin login', app.includes('/admin/login') || app.includes('管理员登录')],
  ['three column CSS', css.includes('grid-template-columns')],
  ['fullscreen CSS', css.includes('.scratch-pad.fullscreen')],
]

const failures = requirements.filter(([, ok]) => !ok)
if (failures.length) {
  console.error('Web smoke test failed:')
  for (const [name] of failures) console.error(`- ${name}`)
  process.exit(1)
}

console.log('Web smoke test passed')
