import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
const css = readFileSync(join(root, 'src/styles.css'), 'utf8')
let scratchPad = ''
let mathToolbar = ''
try {
  scratchPad = readFileSync(join(root, 'src/components/ScratchPad.jsx'), 'utf8')
  mathToolbar = readFileSync(join(root, 'src/components/MathToolbar.jsx'), 'utf8')
} catch {
  scratchPad = ''
  mathToolbar = ''
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
