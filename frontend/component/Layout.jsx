import { NavLink, Outlet } from 'react-router-dom'
import { usePractice } from '../PracticeContext.jsx'

const links = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/upload', label: 'Upload', icon: '📄' },
  { to: '/practice', label: 'Practice', icon: '🎙️' },
  { to: '/results', label: 'Results', icon: '📊' },
  { to: '/history', label: 'History', icon: '🕘' },
]

export default function Layout() {
  const { history } = usePractice()

  return (
    <div className="ss-shell">
      <aside className="ss-sidebar">
        <div className="ss-brand">
          <div className="ss-brand-icon">🎙️</div>
          <div>
            SpeakSmart <span>AI</span>
          </div>
        </div>

        <nav className="ss-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `ss-nav-link${isActive ? ' active' : ''}`
              }
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ss-sidebar-footer">
          {history.length} saved session{history.length === 1 ? '' : 's'}
          <br />
          Every great speaker starts with practice.
        </div>
      </aside>

      <main className="ss-main">
        <Outlet />
      </main>
    </div>
  )
}