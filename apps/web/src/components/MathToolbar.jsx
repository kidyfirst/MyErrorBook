export const mathSnippets = [
  { label: '分数', value: '\\frac{}{}' },
  { label: '根号', value: '\\sqrt{}' },
  { label: '上标', value: '^{}' },
  { label: '下标', value: '_{}' },
  { label: '积分', value: '\\int_{}^{}' },
  { label: '求和', value: '\\sum_{}^{}' },
  { label: 'π', value: '\\pi' },
  { label: 'θ', value: '\\theta' },
  { label: '约等于', value: '\\approx' },
]

export function MathToolbar({ compact = false, onInsert }) {
  return (
    <div className={compact ? 'math-toolbar compact' : 'math-toolbar'} aria-label="插入数学表达式">
      <span>插入数学表达式</span>
      <div>
        {mathSnippets.map((snippet) => (
          <button key={snippet.label} type="button" onClick={() => onInsert(snippet.value)}>
            {snippet.label}
          </button>
        ))}
      </div>
    </div>
  )
}
