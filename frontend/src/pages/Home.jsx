import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const features = [
  {
    icon: '📄',
    title: 'Bring Your Material',
    text: 'Upload your PDF or Word document and read it while you practise.',
  },
  {
    icon: '🎙️',
    title: 'Practise Your Speech',
    text: 'Record your presentation with a live timer, then play it back.',
  },
  {
    icon: '📊',
    title: 'See Where to Improve',
    text: 'Get a score, speaking pace, filler words and clear tips on a dashboard.',
  },
]

export default function Home() {
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    axios
      .get('http://localhost:5000/')
      .then(() => {
        if (!cancelled) setBackendStatus('online')
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('offline')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="ss-page">
      <section className="ss-glass ss-hero">
        <span className="ss-eyebrow">AI-POWERED COMMUNICATION COACH</span>

        <h1>
          Speak with confidence.
          <br />
          <span className="ss-gradient-text">Present with impact.</span>
        </h1>

        <p>
          Practise your speech, discover your filler words and pacing, and
          become a more confident communicator with personalised feedback.
        </p>

        <div className="ss-btn-row" style={{ justifyContent: 'center' }}>
          <Link to="/upload" className="ss-btn ss-btn-primary">
            Get Started →
          </Link>
          <Link to="/history" className="ss-btn ss-btn-ghost">
            View History
          </Link>
        </div>

        {backendStatus === 'offline' && (
          <div className="ss-alert ss-alert-error">
            Could not connect to the backend. Start it with node server.js in
            the backend folder.
          </div>
        )}

        {backendStatus === 'online' && (
          <div className="ss-alert ss-alert-success">Backend connected.</div>
        )}
      </section>

      <section className="ss-grid-3">
        {features.map((feature) => (
          <article key={feature.title} className="ss-glass">
            <div className="ss-feature-icon">{feature.icon}</div>
            <h2>{feature.title}</h2>
            <p className="ss-card-sub">{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  )
}