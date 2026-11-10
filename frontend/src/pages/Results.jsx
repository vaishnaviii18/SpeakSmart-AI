import { Link } from 'react-router-dom'
import { usePractice } from '../PracticeContext.jsx'

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

function scoreLabel(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Getting there'
  return 'Needs practice'
}

function scoreColor(score) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#6d5efc'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

// Build the "where to improve" list from the numbers.
function buildImprovements(result) {
  const items = []
  const words = Number(result.wordCount) || 0
  const fillers = Number(result.totalFillers) || 0
  const per100 = words ? (fillers / words) * 100 : 0
  const avg = Number(result.averageWordsPerSentence) || 0
  const wpm = result.wpm

  if (per100 >= 5) {
    items.push({
      level: 'high',
      title: 'Cut down your filler words',
      text: `About ${per100.toFixed(1)} of every 100 words were fillers. Pause silently instead of saying "um" or "like".`,
    })
  } else if (per100 >= 2) {
    items.push({
      level: 'medium',
      title: 'Trim a few filler words',
      text: `Fillers were ${per100.toFixed(1)} per 100 words. A short pause works better than a filler.`,
    })
  } else {
    items.push({
      level: 'good',
      title: 'Clean delivery',
      text: 'You used very few filler words. Keep it up.',
    })
  }

  if (wpm) {
    if (wpm > 170) {
      items.push({
        level: 'high',
        title: 'Slow down',
        text: `You spoke at about ${wpm} words per minute. Aim for 120 to 160 so the audience can follow.`,
      })
    } else if (wpm > 160) {
      items.push({
        level: 'medium',
        title: 'Slightly fast pace',
        text: `About ${wpm} words per minute. A little slower will sound more confident.`,
      })
    } else if (wpm < 100) {
      items.push({
        level: 'high',
        title: 'Pick up the pace',
        text: `About ${wpm} words per minute is slow. Aim for 120 to 160 to keep attention.`,
      })
    } else if (wpm < 110) {
      items.push({
        level: 'medium',
        title: 'Slightly slow pace',
        text: `About ${wpm} words per minute. A touch faster will keep energy up.`,
      })
    } else {
      items.push({
        level: 'good',
        title: 'Good speaking pace',
        text: `About ${wpm} words per minute is a comfortable pace.`,
      })
    }
  }

  if (avg > 25) {
    items.push({
      level: 'high',
      title: 'Shorten your sentences',
      text: `Your sentences average ${avg} words. Break long ideas into shorter ones.`,
    })
  } else if (avg > 20) {
    items.push({
      level: 'medium',
      title: 'Keep sentences tighter',
      text: `Your sentences average ${avg} words. Shorter sentences are easier to follow.`,
    })
  } else if (avg > 0 && avg < 6) {
    items.push({
      level: 'medium',
      title: 'Connect your ideas',
      text: `Your sentences average only ${avg} words. Join related ideas for smoother flow.`,
    })
  }

  if (words < 50) {
    items.push({
      level: 'medium',
      title: 'Practise a longer speech',
      text: 'Your recording was short. Try a longer practice speech for more detailed feedback.',
    })
  }

  const order = { high: 0, medium: 1, good: 2 }
  return items.sort((a, b) => order[a.level] - order[b.level])
}

export default function Results() {
  const { lastResult } = usePractice()

  if (!lastResult) {
    return (
      <div className="ss-page">
        <div className="ss-glass ss-empty">
          <h2>No results yet</h2>
          <p className="ss-card-sub">
            Record a presentation and analyse it to see your dashboard.
          </p>
          <div className="ss-btn-row" style={{ justifyContent: 'center' }}>
            <Link to="/practice" className="ss-btn ss-btn-primary">
              Go to Practice
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const result = lastResult
  const fillerCounts = result.feedback?.fillerCounts || {}
  const fillerList = Object.entries(fillerCounts).sort((a, b) => b[1] - a[1])
  const maxFiller = fillerList.length ? fillerList[0][1] : 1
  const improvements = buildImprovements(result)
  const suggestions = result.feedback?.suggestions || []

  return (
    <div className="ss-page">
      <div className="ss-page-header">
        <span className="ss-eyebrow">STEP 3 OF 3</span>
        <h1>
          Your results <span className="ss-gradient-text">dashboard.</span>
        </h1>
        <p>Here is how your presentation went and where you can improve.</p>
      </div>

      <section className="ss-glass ss-score-card">
        <div
          className="ss-score-ring"
          style={{ '--pct': result.score, '--ring': scoreColor(result.score) }}
        >
          <div className="ss-score-ring-inner">
            <strong>{result.score}</strong>
            <span>out of 100</span>
          </div>
        </div>

        <div>
          <h2>{scoreLabel(result.score)}</h2>
          <p className="ss-card-sub" style={{ maxWidth: 420 }}>
            Your practice score combines filler words, speaking pace and
            sentence length.
          </p>
        </div>
      </section>

      <section className="ss-grid-4">
        <div className="ss-glass">
          <div className="ss-stat-label">Words</div>
          <div className="ss-stat-value">{result.wordCount}</div>
          <div className="ss-stat-hint">Total spoken</div>
        </div>

        <div className="ss-glass">
          <div className="ss-stat-label">Sentences</div>
          <div className="ss-stat-value">{result.sentenceCount}</div>
          <div className="ss-stat-hint">
            {result.averageWordsPerSentence} words each
          </div>
        </div>

        <div className="ss-glass">
          <div className="ss-stat-label">Pace</div>
          <div className="ss-stat-value">{result.wpm ?? '-'}</div>
          <div className="ss-stat-hint">words per minute</div>
        </div>

        <div className="ss-glass">
          <div className="ss-stat-label">Filler words</div>
          <div className="ss-stat-value">{result.totalFillers}</div>
          <div className="ss-stat-hint">
            {result.durationSeconds
              ? `in ${formatTime(result.durationSeconds)}`
              : 'in total'}
          </div>
        </div>
      </section>

      <section className="ss-grid-2">
        <div className="ss-glass">
          <h2>Filler word breakdown</h2>

          {fillerList.length === 0 ? (
            <p className="ss-card-sub" style={{ marginTop: 12 }}>
              No filler words found. Great job!
            </p>
          ) : (
            fillerList.map(([word, count]) => (
              <div className="ss-bar-row" key={word}>
                <span>{word}</span>
                <div className="ss-bar-track">
                  <div
                    className="ss-bar-fill"
                    style={{ width: `${(count / maxFiller) * 100}%` }}
                  />
                </div>
                <span>{count}</span>
              </div>
            ))
          )}
        </div>

        <div className="ss-glass">
          <h2>Where to improve</h2>

          {improvements.map((item) => (
            <div className="ss-tip" key={item.title}>
              <span className={`ss-badge ss-badge-${item.level}`}>
                {item.level === 'good' ? 'Good' : item.level}
              </span>
              <div>
                <strong style={{ color: '#1e1b4b' }}>{item.title}</strong>
                <p className="ss-card-sub">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="ss-glass">
          <h2>More suggestions</h2>
          {suggestions.map((suggestion, index) => (
            <div className="ss-tip" key={index}>
              <span className="ss-badge ss-badge-medium">Tip</span>
              <p>{suggestion}</p>
            </div>
          ))}
          {result.feedback?.note && (
            <p className="ss-card-sub" style={{ marginTop: 14 }}>
              {result.feedback.note}
            </p>
          )}
        </section>
      )}

      <div className="ss-btn-row">
        <Link to="/practice" className="ss-btn ss-btn-primary">
          Practise Again
        </Link>
        <Link to="/history" className="ss-btn ss-btn-ghost">
          View History
        </Link>
      </div>
    </div>
  )
}
