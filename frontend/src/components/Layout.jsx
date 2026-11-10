import { NavLink, Outlet } from 'react-router-dom'
import { usePractice } from '../PracticeContext.jsx'

const links = [
  { to: '/', label: 'Home', icon: '\u{1F3E0}', end: true },
  { to: '/upload', label: 'Upload', icon: '\u{1F4C4}' },
  { to: '/practice', label: 'Practice', icon: '\u{1F399}\uFE0F' },
  { to: '/results', label: 'Results', icon: '\u{1F4CA}' },
  { to: '/history', label: 'History', icon: '\u{1F558}' },
]

export default function Layout() {
  const { history } = usePractice()

  return (
    <div className="ss-shell">
      <aside className="ss-sidebar">
        <div className="ss-brand">
          <div className="ss-brand-icon">{'\u{1F399}\uFE0F'}</div>
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
