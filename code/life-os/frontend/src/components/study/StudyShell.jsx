import { useState } from 'react'
import { Link } from 'react-router-dom'
import { titleOf } from '../../lib/study.js'
import StudyIcon from './StudyIcon.jsx'
import { moduleTitle } from './workbench.js'

// Sidebar, brand, progress footer and topbar markup adapted from Summer Rescue App.jsx.
const NAV_GROUPS = [
  { label: 'Study', items: ['overview', 'schedule', 'materials', 'progress'] },
  { label: 'Planning', items: ['planner', 'week', 'assessments'] },
  { label: 'Board', items: ['board', 'table', 'evidence'] },
  { label: 'Focus', items: ['rescue', 'history', 'admin'] }
]
const ICONS = { overview: 'hub', planner: 'dashboard', admin: 'settings' }
export default function StudyShell({ view, views, onView, modules, moduleId, onModule, semester, stats, sidebarCollapsed = false, onCollapse, controls, children }) {
  const [navOpen, setNavOpen] = useState(false)
  const labels = Object.fromEntries(views)
  const navigate = target => { onView(target); setNavOpen(false) }
  return <div className={`srp-layout${sidebarCollapsed ? ' nav-collapsed' : ''}${navOpen ? ' nav-open' : ''}`}>
    {navOpen && <button type="button" className="nav-scrim" aria-label="Close Study menu" onClick={() => setNavOpen(false)} />}
    <aside className="app-sidebar" aria-label="Study navigation">
      <div className="sidebar-brand"><span className="brand-mark"><StudyIcon name="brand" /></span><span className="brand-text"><strong>Study Hub</strong><small>{semester ? titleOf(semester) : 'Your study workspace'}</small></span></div>
      <nav className="sidebar-nav" aria-label="Study views">
        {NAV_GROUPS.map(group => <div className="nav-group" key={group.label}><p className="nav-group-label">{group.label}</p>{group.items.map(id => <button type="button" key={id} className={`nav-item${view === id ? ' active' : ''}`} title={labels[id]} onClick={() => navigate(id)}><span className="nav-ico"><StudyIcon name={ICONS[id] || id} /></span><span className="nav-label">{labels[id]}</span></button>)}</div>)}
        {modules.length > 0 && <div className="nav-group"><p className="nav-group-label">Modules</p>{modules.map(module => <button type="button" key={module.id} className={`nav-item${module.id === moduleId && view === 'overview' ? ' active' : ''}`} title={moduleTitle(module)} onClick={() => { onModule(module.id); navigate('overview') }}><span className="nav-ico"><StudyIcon name="module" /></span><span className="nav-label">{moduleTitle(module)}</span></button>)}</div>}
      </nav>
      <div className="sidebar-foot"><Link className="nav-item study-back-link" to="/court"><span aria-hidden="true">←</span><span className="nav-label">Back to Life OS</span></Link><div className="mini-progress" title={`${stats.done} of ${stats.total} cards completed`}><div className="mini-progress-head"><span>Study progress</span><strong>{stats.percent}%</strong></div><div className="mini-progress-track"><span style={{ width: `${stats.percent}%` }} /></div><small>{stats.done} of {stats.total} cards</small></div><button type="button" className="collapse-btn" onClick={onCollapse} aria-label={sidebarCollapsed ? 'Expand Study sidebar' : 'Collapse Study sidebar'}><StudyIcon name="chevron" /><span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span></button></div>
    </aside>
    <main className="app-main"><header className="app-topbar"><div className="topbar-left"><button type="button" className="icon-button nav-toggle" aria-label="Open Study menu" onClick={() => setNavOpen(true)}><StudyIcon name="menu" /></button><div className="topbar-title"><p className="eyebrow">Study Hub</p><h1>{labels[view] || 'Study Hub'}</h1><p className="topbar-sub">{semester ? titleOf(semester) : 'Modules, plans and materials, semester after semester.'}</p></div></div><div className="topbar-right">{controls}</div></header>{children}</main>
  </div>
}
