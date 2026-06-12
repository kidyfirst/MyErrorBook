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
  ['answer scratchpad', app.includes('purpose="answer"') && scratchPad.includes('answer-pad')],
  ['mathlive answer input', scratchPad.includes('mathlive') && scratchPad.includes('<math-field')],
  ['keyboard answer input', scratchPad.includes('onInput') && scratchPad.includes('mathFieldRef')],
  ['latex source keyboard fallback', scratchPad.includes('latex-source-input') && scratchPad.includes('LaTeX 源码')],
  ['draft scratchpad', app.includes('purpose="draft"') && app.includes('draft-panel')],
  ['draft keyboard input', scratchPad.includes('draft-text-input') && scratchPad.includes('草稿输入')],
  ['draft structured value', scratchPad.includes('draft-text-and-sketch-v1') && scratchPad.includes('syncDraftText')],
  ['sketch canvas draft engine', scratchPad.includes('react-sketch-canvas') && scratchPad.includes('<ReactSketchCanvas')],
  ['custom sketch toolbar', scratchPad.includes('scratch-pad-actions') && scratchPad.includes('setTool')],
  ['scratchpad controls', scratchPad.includes('全屏') && scratchPad.includes('放大') && scratchPad.includes('缩小') && scratchPad.includes('适应')],
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
