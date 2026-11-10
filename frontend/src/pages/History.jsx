import { Link } from 'react-router-dom'
import { usePractice } from '../PracticeContext.jsx'

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function scoreColor(score) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#6d5efc'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export default function History() {
  const { history, clearHistory } = usePractice()

  if (history.length === 0) {
    return (
      <div className="ss-page">
        <div className="ss-page-header">
          <h1>
            Your practice <span className="ss-gradient-text">history.</span>
          </h1>
          <p>Every analysed session is saved here so you can track progress.</p>
        </div>

        <div className="ss-glass ss-empty">
          <h2>No sessions yet</h2>
          <p className="ss-card-sub">
            Record and analyse a presentation to start your history.
          </p>
          <div className="ss-btn-row" style={{ justifyContent: 'center' }}>
            <Link to="/upload" className="ss-btn ss-btn-primary">
              Start Practising
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const scores = history.map((entry) => entry.score)
  const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
  const best = Math.max(...scores)
  const chartEntries = history.slice(0, 12).reverse()

  const handleClear = () => {
    if (window.confirm('Delete all saved practice sessions? This cannot be undone.')) {
      clearHistory()
    }
  }

  return (
    <div className="ss-page">
      <div className="ss-page-header">
        <h1>
          Your practice <span className="ss-gradient-text">history.</span>
        </h1>
        <p>Every analysed session is saved here so you can track progress.</p>
      </div>

      <section className="ss-grid-3">
        <div className="ss-glass">
          <div className="ss-stat-label">Sessions</div>
          <div className="ss-stat-value">{history.length}</div>
          <div className="ss-stat-hint">saved in this browser</div>
        </div>

        <div className="ss-glass">
          <div className="ss-stat-label">Average score</div>
          <div className="ss-stat-value">{average}</div>
          <div className="ss-stat-hint">out of 100</div>
        </div>

        <div className="ss-glass">
          <div className="ss-stat-label">Best score</div>
          <div className="ss-stat-value">{best}</div>
          <div className="ss-stat-hint">your top session</div>
        </div>
      </section>

      <section className="ss-glass">
        <h2>Score over time</h2>
        <p className="ss-card-sub">Oldest on the left, latest on the right.</p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            height: 180,
            marginTop: 18,
          }}
        >
          {chartEntries.map((entry) => (
            <div
              key={entry.id}
              title={`${formatDate(entry.date)}: ${entry.score}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                height: '100%',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b' }}>
                {entry.score}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 48,
                  height: `${Math.max(entry.score, 4)}%`,
                  borderRadius: 10,
                  background: scoreColor(entry.score),
                  opacity: 0.9,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ss-glass">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2>All sessions</h2>
          <button className="ss-btn ss-btn-danger" onClick={handleClear}>
            Clear History
          </button>
        </div>

        {history.map((entry) => (
          <div className="ss-history-item" key={entry.id}>
            <div>
              <strong style={{ color: '#1e1b4b' }}>{formatDate(entry.date)}</strong>
              <p className="ss-card-sub">
                {entry.wordCount} words, {entry.totalFillers} fillers
                {entry.wpm ? `, ${entry.wpm} words per minute` : ''}
              </p>
            </div>

            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: scoreColor(entry.score),
              }}
            >
              {entry.score}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
