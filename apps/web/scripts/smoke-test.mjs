import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
const css = readFileSync(join(root, 'src/styles.css'), 'utf8')
let scratchPad = ''
let mathToolbar = ''
let richEditor = ''
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
  richEditor = readFileSync(join(root, 'src/components/RichEditor.jsx'), 'utf8')
} catch {
  richEditor = ''
}

const requirements = [
  ['left menu', app.includes('错题录入') && app.includes('每日一题')],
  ['page does not scroll', css.includes('overflow: hidden') && css.includes('height: 100vh')],
  ['daily panel flex layout', css.includes('.question-panel') && css.includes('display: flex') && css.includes('flex-direction: column')],
  ['rich editor component', richEditor.includes('export function RichEditor')],
  ['answer rich editor', app.includes('purpose="answer"') && app.includes('<RichEditor')],
  ['draft rich editor', app.includes('purpose="draft"') && app.includes('draft-panel') && app.includes('<RichEditor')],
  ['draft fullscreen question context', app.includes('contextText={daily?.questionText}') && richEditor.includes('fullscreen-context')],
  ['answer input fills remaining height', css.includes('.rich-editor-answer') && css.includes('flex: 1') && css.includes('min-height: 0')],
  ['input panels scroll internally', css.includes('overflow-y: auto') && css.includes('.rich-editor-body')],
  ['rich editor controls', richEditor.includes('全屏') && richEditor.includes('放大') && richEditor.includes('缩小')],
  ['rich editor clearing', richEditor.includes('整体清除') && richEditor.includes('局部清除')],
  ['tinymce math demo menu', app.includes("id: 'rich-math-demo'") && app.includes('公式编辑 Demo')],
  ['tinymce5 rich editor', richEditor.includes('tinymce/tinymce') && richEditor.includes('tinymce.init') && richEditor.includes('mathliveFormula')],
  ['mathlive formula plugin', richEditor.includes('<math-field') && richEditor.includes('openFormulaDialog')],
  ['mathjax svg rendering', richEditor.includes('mathjax') && richEditor.includes('tex2svg') && richEditor.includes('math-formula-svg')],
  ['editable svg formula image', richEditor.includes('data-latex') && richEditor.includes('dblclick') && richEditor.includes('replaceFormulaImage')],
  ['no rich math editor references', !app.includes('RichMathEditor') && !richEditor.includes('RichMathEditor')],
  ['admin login', app.includes('/admin/login') || app.includes('管理员登录')],
  ['three column CSS', css.includes('grid-template-columns')],
  ['fullscreen CSS', css.includes('.rich-editor.fullscreen')],
]

const failures = requirements.filter(([, ok]) => !ok)
if (failures.length) {
  console.error('Web smoke test failed:')
  for (const [name] of failures) console.error(`- ${name}`)
  process.exit(1)
}

console.log('Web smoke test passed')
