import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Camera,
  ChartNoAxesColumn,
  CheckCircle2,
  ClipboardPenLine,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Sigma,
  Shield,
} from 'lucide-react'
import { RichEditor } from './components/RichEditor.jsx'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const defaultSuggestion = {
  questionText: '2 + 3 = ?',
  correctAnswer: '5',
  analysis: '加法基础题，计算 2 和 3 的和。',
  aiSuggestedSubject: 'math',
  confirmedSubject: 'math',
  aiSuggestedGradeId: 'grade-8',
  confirmedGradeId: 'grade-8',
  provinceId: 'guangdong',
  knowledgePointIds: ['kp-addition'],
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export function App() {
  const [active, setActive] = useState('upload')
  const [user, setUser] = useState(null)
  const [suggestion, setSuggestion] = useState(defaultSuggestion)
  const [errors, setErrors] = useState([])
  const [daily, setDaily] = useState(null)
  const [answer, setAnswer] = useState('')
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [stats, setStats] = useState({ total: 0, reviewing: 0, mastered: 0 })
  const [message, setMessage] = useState('')

  const userId = user?.id

  const menu = useMemo(
    () => [
      { id: 'upload', label: '错题录入', icon: Camera },
      { id: 'list', label: '错题列表', icon: BookOpen },
      { id: 'daily', label: '每日一题', icon: ClipboardPenLine },
      { id: 'rich-math-demo', label: '公式编辑 Demo', icon: Sigma },
      { id: 'stats', label: '统计看板', icon: ChartNoAxesColumn },
      { id: 'admin', label: '管理员入口', icon: Shield },
    ],
    [],
  )

  useEffect(() => {
    if (!userId) return
    refreshData(userId)
  }, [userId])

  async function refreshData(id = userId) {
    if (!id) return
    const [items, overview] = await Promise.all([
      request(`/api/error-items?userId=${id}`),
      request(`/api/stats/overview?userId=${id}`),
    ])
    setErrors(items)
    setStats(overview)
  }

  async function loginAsUser() {
    const result = await request('/api/auth/wechat/callback', {
      method: 'POST',
      body: JSON.stringify({
        openid: 'demo-openid',
        phone: 'demo-phone',
        nickname: 'MVP 用户',
        province: 'guangdong',
        grade: 'grade-8',
      }),
    })
    setUser(result.user)
    setMessage('已通过微信 OAuth 模拟登录，Session 有效期 30 天')
  }

  async function uploadImage(event) {
    event.preventDefault()
    const result = await request('/api/error-images', { method: 'POST', body: '{}' })
    setSuggestion(result.suggestion)
    setMessage('图片已识别，请确认题目信息')
  }

  async function confirmError() {
    if (!userId) {
      setMessage('请先登录')
      return
    }
    const item = await request(`/api/error-items/confirm?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ ...suggestion, userId }),
    })
    setDaily(item)
    setActive('daily')
    setMessage('错题已保存到默认错题本')
    await refreshData(userId)
  }

  async function loadDaily() {
    if (!userId) return
    const item = await request(`/api/daily-question?userId=${userId}`)
    setDaily(item.empty ? null : item)
    setFeedback(null)
    setAnswer('')
    setActive('daily')
  }

  async function submitAnswer() {
    if (!daily?.id || !userId) return
    const result = await request('/api/daily-question/answer', {
      method: 'POST',
      body: JSON.stringify({ userId, errorItemId: daily.id, answerText: answer }),
    })
    setFeedback(result)
    setDaily(result.item)
    await refreshData(userId)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <GraduationCap size={24} />
          <div>
            <strong>MyErrorBook</strong>
            <span>AI 错题集</span>
          </div>
        </div>

        <button className="login-card" onClick={loginAsUser}>
          <LogIn size={18} />
          <span>{user ? user.nickname : '用户登录'}</span>
        </button>

        <a className="admin-link" href="/admin/login" onClick={(event) => event.preventDefault()}>
          管理员登录
        </a>

        <nav className="menu">
          {menu.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={active === item.id ? 'active' : ''}
                onClick={() => {
                  setActive(item.id)
                  if (item.id === 'daily') loadDaily()
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-stats">
          <span>待复习 {stats.reviewing}</span>
          <span>已完成 {stats.mastered}</span>
        </div>
      </aside>

      <main className="workbench">
        <header className="topbar">
          <div>
            <p>广东省 · 初二 · 默认错题本</p>
            <h1>{titleFor(active)}</h1>
          </div>
          {message && <span className="status-pill">{message}</span>}
        </header>

        {active === 'upload' && (
          <section className="panel">
            <h2>拍照或上传错题</h2>
            <form className="upload-zone" onSubmit={uploadImage}>
              <input type="file" accept="image/*" capture="environment" />
              <button type="submit">模拟 OCR 识别</button>
            </form>

            <div className="confirm-grid">
              <label>
                题目
                <textarea
                  value={suggestion.questionText}
                  onChange={(e) => setSuggestion({ ...suggestion, questionText: e.target.value })}
                />
              </label>
              <label>
                正确答案
                <input
                  value={suggestion.correctAnswer}
                  onChange={(e) => setSuggestion({ ...suggestion, correctAnswer: e.target.value })}
                />
              </label>
              <label>
                学科
                <select
                  value={suggestion.confirmedSubject}
                  onChange={(e) => setSuggestion({ ...suggestion, confirmedSubject: e.target.value })}
                >
                  <option value="math">数学</option>
                  <option value="english">英语</option>
                  <option value="physics">物理</option>
                </select>
              </label>
              <label>
                年级
                <select
                  value={suggestion.confirmedGradeId}
                  onChange={(e) => setSuggestion({ ...suggestion, confirmedGradeId: e.target.value })}
                >
                  <option value="grade-7">初一</option>
                  <option value="grade-8">初二</option>
                  <option value="grade-9">初三</option>
                </select>
              </label>
              <label className="wide">
                解析
                <textarea
                  value={suggestion.analysis}
                  onChange={(e) => setSuggestion({ ...suggestion, analysis: e.target.value })}
                />
              </label>
            </div>
            <button className="primary" onClick={confirmError}>确认保存</button>
          </section>
        )}

        {active === 'list' && (
          <section className="panel">
            <h2>错题列表</h2>
            <div className="error-list">
              {errors.map((item) => (
                <article key={item.id}>
                  <strong>{item.questionText}</strong>
                  <span>{item.confirmedSubject} · {item.confirmedGradeId} · {item.status}</span>
                </article>
              ))}
              {!errors.length && <p className="empty">还没有错题，先去录入一题。</p>}
            </div>
          </section>
        )}

        {active === 'daily' && (
          <section className="panel question-panel">
            <h2>题目</h2>
            {daily ? (
              <>
                <p className="question-text">{daily.questionText}</p>
                <RichEditor
                  purpose="answer"
                  title="答题区"
                  description="整块面板均可键盘输入，支持富文本、换行推导和数学公式。"
                  value={answer}
                  onChange={setAnswer}
                  placeholder="输入答案，例如分步推导、表格、公式或文字说明。"
                />
                <button className="primary" onClick={submitAnswer}>提交批改</button>
                {feedback && (
                  <div className="feedback">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>{feedback.grading.answer.gradeResult}</strong>
                      <p>{feedback.grading.answer.gradeReason}</p>
                      {feedback.grading.diagnoses.map((diag) => (
                        <p key={diag.id}>知识点诊断：{diag.knowledgePointId} · {diag.aiExplanation}</p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="empty">暂无待复习题目。</p>
            )}
          </section>
        )}

        {active === 'stats' && (
          <section className="panel">
            <h2>统计看板</h2>
            <div className="stat-grid">
              <div><strong>{stats.total}</strong><span>错题总数</span></div>
              <div><strong>{stats.reviewing}</strong><span>待复习</span></div>
              <div><strong>{stats.mastered}</strong><span>已完成</span></div>
            </div>
          </section>
        )}

        {active === 'rich-math-demo' && (
          <RichEditor
            title="公式富文本编辑 Demo"
            description="TinyMCE 5 作为富文本编辑器，MathLive 负责公式录入，MathJax 负责 SVG 公式渲染。"
            showPreview
          />
        )}

        {active === 'admin' && (
          <section className="panel">
            <LayoutDashboard size={28} />
            <h2>管理员后台</h2>
            <p>当前 MVP 提供管理员登录入口、用户管理占位、AI 日志占位和广东省教材知识点维护占位。</p>
          </section>
        )}
      </main>

      <RichEditor
        purpose="draft"
        className="draft-panel"
        title="草稿区"
        description="整块面板均可键盘输入，用于记录思路、步骤、公式和临时计算。"
        value={draft}
        onChange={setDraft}
        placeholder="例如：先代入 x=3，再计算 y=2x+1..."
        contextTitle="当前题目"
        contextText={daily?.questionText}
      />
    </div>
  )
}

function titleFor(active) {
  return {
    upload: '错题录入',
    list: '错题列表',
    daily: '每日一题',
    'rich-math-demo': '公式编辑 Demo',
    stats: '统计看板',
    admin: '管理员入口',
  }[active]
}
