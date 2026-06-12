import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
const css = readFileSync(join(root, 'src/styles.css'), 'utf8')

const requirements = [
  ['left menu', app.includes('错题录入') && app.includes('每日一题')],
  ['middle question area', app.includes('answer-input') && app.includes('题目')],
  ['right draft area', app.includes('draft-panel') && app.includes('草稿区')],
  ['math input toolbar', app.includes('math-toolbar') && app.includes('插入数学表达式')],
  ['latex snippets', app.includes('\\\\frac{}{}') && app.includes('\\\\sqrt{}') && app.includes('^{}')],
  ['admin login', app.includes('/admin/login') || app.includes('管理员登录')],
  ['three column CSS', css.includes('grid-template-columns')],
]

const failures = requirements.filter(([, ok]) => !ok)
if (failures.length) {
  console.error('Web smoke test failed:')
  for (const [name] of failures) console.error(`- ${name}`)
  process.exit(1)
}

console.log('Web smoke test passed')
