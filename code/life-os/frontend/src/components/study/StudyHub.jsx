import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { useLondonToday } from '../../lib/useCalendar.js'
import { cardActionable, cardDateFields, cardDone, cardDue, cardHours, cardLane, dataOf, DEFAULT_LANES, DEFAULT_PRIORITIES, DEFAULT_SLOTS, displayDate, EMPTY_WORKSPACE, filterCards, laneStatus, localClock, normaliseWorkspace, recordPayload, safeMaterialUrl, scopedRows, studyPreferences, studyStats, titleOf } from '../../lib/study.js'
import StudyCardEditor from './StudyCardEditor.jsx'
import StudyRecordEditor from './StudyRecordEditor.jsx'
import StudyMaterials, { StudyReader } from './StudyMaterials.jsx'
import StudyTimer from './StudyTimer.jsx'
import StudyImport, { downloadJson } from './StudyImport.jsx'
import StudyDialog from './StudyDialog.jsx'
import { CardList, StudyAssessments, StudyBoard, StudyEvidence, StudyMetrics, StudyOverview, StudyProgress, StudyRescue, StudySchedule, StudyTable, StudyWeek } from './StudyViews.jsx'
import './study.css'
import './study-workbench.css'
import { initialSemester, moduleTitle, workbenchData } from './workbench.js'
import StudyShell from './StudyShell.jsx'
import StudyIcon from './StudyIcon.jsx'
import { MusicPopover } from './StudyMusicPopover.jsx'
import { Celebration } from './StudyCelebration.jsx'
import StyleSwitch from '../StyleSwitch.jsx'
import StudyHistory from './StudyHistory.jsx'
import { useGround } from '../../lib/groundContext.jsx'
import './summer-rescue-transferred.css'
import './summer-rescue-native.css'
import './study-skin.css'

const VIEWS = [['overview', 'Overview'], ['planner', 'Planner'], ['board', 'Board'], ['table', 'List'], ['week', 'Week'], ['schedule', 'Timetable'], ['assessments', 'Assessments'], ['materials', 'Materials'], ['progress', 'Progress'], ['evidence', 'Evidence'], ['rescue', 'Rescue'], ['admin', 'Settings'], ['history', 'History']]
const emptyFilters = { search: '', lane: '', priority: '', phase: '', slot: '', tag: '', date: '' }
const newId = () => crypto.randomUUID()

function StudyPreferences({ preferences, record, onSave, onClose }) {
  const [startingRecord] = useState(record || null)
  const [form, setForm] = useState({ ...preferences, lanes: (preferences.lanes || DEFAULT_LANES).join('\n'), priorities: (preferences.priorities || DEFAULT_PRIORITIES).join('\n'), slots: (preferences.slots || DEFAULT_SLOTS).join('\n'), focusMusicUrl: preferences.focusMusicUrl || '' })
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  return <StudyDialog title="Study preferences" onClose={onClose}><form className="study-form" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { const values = key => [...new Set(form[key].split('\n').map(v => v.trim()).filter(Boolean))]; if (!values('lanes').includes('Done')) throw new Error('Keep a Done lane so completed cards remain visible.'); await onSave({ ...dataOf(startingRecord), ...form, lanes: values('lanes'), priorities: values('priorities'), slots: values('slots') }, startingRecord); onClose() } catch (cause) { setError(cause.message) } finally { setBusy(false) } }}>
    <p className="study-muted">Modules and semesters are managed in the workspace. These shared options apply to new and existing cards.</p>
    {[['lanes', 'Card lanes'], ['priorities', 'Priorities'], ['slots', 'Study slots']].map(([key, label]) => <label key={key}>{label}, one per line<textarea rows={5} value={form[key]} onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))} /></label>)}
    <label className="study-check-label"><input type="checkbox" checked={form.celebrations !== false} onChange={e => setForm(current => ({ ...current, celebrations: e.target.checked }))} />Celebrate completed cards</label>
    <label className="study-check-label"><input type="checkbox" checked={form.showWelcome !== false} onChange={e => setForm(current => ({ ...current, showWelcome: e.target.checked }))} />Show the Study introduction</label>
    <label>Focus music link (optional)<input type="url" value={form.focusMusicUrl} onChange={e => setForm(current => ({ ...current, focusMusicUrl: e.target.value }))} /></label>
    <p className="study-muted">Study follows the Life OS style you choose. All edits save through Life OS; export keeps a portable copy. The original Study app remains available until you accept its replacement.</p>
    {error && <p className="study-error" role="alert">{error}</p>}<button type="submit" className="study-primary" disabled={busy}>{busy ? 'Saving…' : 'Save preferences'}</button>
  </form></StudyDialog>
}

export default function StudyHub() {
  const today = useLondonToday(), location = useLocation(), { ground } = useGround()
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [actionError, setActionError] = useState('')
  const [semesterId, setSemesterId] = useState(''), [moduleId, setModuleId] = useState(''), [view, setView] = useState('overview'), [filters, setFilters] = useState(emptyFilters)
  const [editor, setEditor] = useState(null), [reader, setReader] = useState(null), [importOpen, setImportOpen] = useState(false), [preferencesOpen, setPreferencesOpen] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false), [focusedCardId, setFocusedCardId] = useState(null), [saving, setSaving] = useState(false), [notice, setNotice] = useState(''), [celebrating, setCelebrating] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false), [commandQuery, setCommandQuery] = useState(''), [bulkDate, setBulkDate] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const requests = useRef(0), workspaceRef = useRef(workspace), consumedSearch = useRef('')
  const scopeChosen = useRef(false), shellRef = useRef(null), discoverySignature = useRef('')
  const [discovery, setDiscovery] = useState(null)
  workspaceRef.current = workspace
  const refresh = useCallback(async (silent = false) => {
    const request = ++requests.current
    if (!silent) setLoading(true)
    try {
      const value = normaliseWorkspace(await apiFetch('/api/study/workspace'))
      if (request === requests.current) { setWorkspace(value); workspaceRef.current = value; setLoadError('') }
      return value
    } catch (cause) { if (request === requests.current) setLoadError(cause.message); throw cause }
    finally { if (request === requests.current) setLoading(false) }
  }, [])
  useEffect(() => { refresh().catch(() => {}); return () => { requests.current++ } }, [refresh])
  useEffect(() => {
    let cancelled = false
    const poll = async (focused = false) => {
      if (document.visibilityState === 'hidden') return
      try {
        const status = await apiFetch('/api/study/discovery')
        if (cancelled) return
        setDiscovery(status)
        const signature = JSON.stringify((status.mappings || []).map(row => [row.module_id, row.last_scan_at, row.added, row.changed]))
        const changed = discoverySignature.current && signature !== discoverySignature.current
        discoverySignature.current = signature
        if (focused || view === 'materials' || changed && (status.mappings || []).some(row => row.added || row.changed)) await refresh(true)
      } catch { if (focused && !cancelled) refresh(true).catch(() => {}) }
    }
    const visible = () => { if (document.visibilityState !== 'hidden') poll(true) }
    const focus = () => poll(true)
    poll()
    const interval = setInterval(() => poll(), 30_000)
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visible)
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible) }
  }, [view, refresh])
  useEffect(() => {
    const handle = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(current => !current) } }
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle)
  }, [])
  useEffect(() => { if (celebrating) { const handle = setTimeout(() => setCelebrating(false), 2200); return () => clearTimeout(handle) } }, [celebrating])
  const preferencesRow = workspace.settings.find(row => dataOf(row).key === 'preferences')
  const preferences = studyPreferences(dataOf(preferencesRow))
  useEffect(() => {
    if (loading || loadError || scopeChosen.current || !workspace.semesters.length) return
    scopeChosen.current = true; setSemesterId(initialSemester(workspace, today))
  }, [loading, loadError, workspace.semesters.length, today])
  const timerSetting = workspace.settings.find(row => dataOf(row).key === 'focusTimer')
  const modules = workspace.modules.filter(row => !semesterId || row.semester_id === semesterId)
  const activeModule = workspace.modules.find(row => row.id === moduleId)
  const scope = { semesterId, moduleId }
  const allCards = scopedRows(workspace.cards, semesterId, moduleId)
  const parents = workspace
  const selectedSemesterId = semesterId || activeModule?.semester_id || ''
  const selectedSemester = workspace.semesters.find(row => row.id === selectedSemesterId)
  const contextCards = scopedRows(workspace.cards, selectedSemesterId)
  const contextSessions = scopedRows(workspace.sessions, selectedSemesterId)
  const cards = useMemo(() => filterCards(workspace.cards, { ...filters, ...scope, today, parents }), [workspace.cards, workspace.modules, workspace.semesters, semesterId, moduleId, filters, today])
  const stats = studyStats(allCards, today, parents)
  const sourceNotifications = dataOf(workspace.settings.find(row => dataOf(row).key === 'notifications')).items || []
  const preservedNotifications = sourceNotifications.map(row => ({ ...row, text: row.title || row.message || row.body || 'Study notification', nativeCardId: workspace.cards.find(card => dataOf(card).sourceId === row.cardId)?.id }))
  const notifications = [...stats.overdue.map(card => ({ id: `overdue:${card.id}:${cardDue(card)}`, text: `${titleOf(card)} is overdue`, nativeCardId: card.id })),
    ...stats.dueToday.map(card => ({ id: `due:${card.id}:${today}`, text: `${titleOf(card)} is due today`, nativeCardId: card.id }))]
  const notificationReadIds = preferences.notificationReadIds || []
  const unread = notifications.filter(row => !row.read && !notificationReadIds.includes(row.id)).length
  const musicUrl = safeMaterialUrl(preferences.focusMusicUrl)
  const materials = scopedRows(workspace.materials, semesterId, moduleId), sessions = scopedRows(workspace.sessions, semesterId, moduleId), assessments = scopedRows(workspace.assessments, semesterId, moduleId)
  const lanes = [...new Set([...(Array.isArray(preferences.lanes) ? preferences.lanes : DEFAULT_LANES), ...allCards.map(cardLane)])]
  const phases = [...new Set(allCards.map(row => dataOf(row).phase).filter(Boolean))].sort(), tags = [...new Set(allCards.flatMap(row => dataOf(row).tags || []))].sort()

  useEffect(() => {
    if (!location.search || consumedSearch.current === location.search || loading || loadError) return
    const params = new URLSearchParams(location.search), cardId = params.get('card') || (params.get('entity') === 'cards' ? params.get('id') : '')
    const assessmentId = params.get('assessment'), sessionId = params.get('session'), materialId = params.get('material')
    const row = cardId && workspace.cards.find(card => card.id === cardId)
    if (row) { scopeChosen.current = true; setSemesterId(row.semester_id || ''); setModuleId(row.module_id || ''); setEditor({ type: 'cards', record: row }) }
    if (assessmentId) { const record = workspace.assessments.find(row => row.id === assessmentId); if (record) { setView('assessments'); setEditor({ type: 'assessments', record }) } }
    if (sessionId) { const record = workspace.sessions.find(row => row.id === sessionId); if (record) { setView('schedule'); setEditor({ type: 'sessions', record }) } }
    if (materialId) { const record = workspace.materials.find(row => row.id === materialId); if (record) setReader(record) }
    if (cardId || assessmentId || sessionId || materialId) consumedSearch.current = location.search
  }, [location.search, loading, loadError, workspace.cards.length, workspace.assessments.length, workspace.sessions.length, workspace.materials.length])

  async function save(type, record, payload) {
    setSaving(true); setActionError('')
    try {
      const result = await apiFetch(`/api/study/${type}${record ? `/${record.id}` : ''}`, { method: record ? 'PATCH' : 'POST', body: JSON.stringify({ ...payload, ...(record ? { revision: record.revision } : {}) }) })
      const updated = await refresh(true)
      setNotice('Saved to Life OS.')
      return result.record || result.row || result.material || result || updated[type].find(row => row.id === record?.id)
    } finally { setSaving(false) }
  }
  async function remove(type, record) {
    await apiFetch(`/api/study/${type}/${record.id}`, { method: 'DELETE', body: JSON.stringify({ revision: record.revision }) })
    await refresh(true); setNotice('Removed. The record remains in history.')
  }
  async function doAction(callback) { setActionError(''); try { return await callback() } catch (cause) { setActionError(`${cause.message} Refresh to get the latest saved record before trying again.`); throw cause } }
  function quick(callback) { doAction(callback).catch(() => {}) }
  async function patchCard(card, dataPatch, envelopePatch = {}) {
    const now = new Date().toISOString(), data = dataOf(card)
    return save('cards', card, { ...envelopePatch, data: { ...data, ...dataPatch, activity: dataPatch.activity || [...(data.activity ?? []), { id: newId(), at: now, action: envelopePatch.end_date ? 'Rescheduled card' : dataPatch.done ? 'Marked done' : 'Updated card' }] } })
  }
  async function lane(card, value, note = '') {
    await doAction(() => patchCard(card, { lane: value, done: value === 'Done', completedAt: value === 'Done' ? dataOf(card).completedAt || new Date().toISOString() : null,
      ...(note ? { notes: [...(dataOf(card).notes ?? []), { id: newId(), at: new Date().toISOString(), text: note }] } : {}) }, { status: laneStatus(value) }))
  }
  async function done(card) {
    const completing = !cardDone(card)
    await lane(card, completing ? 'Done' : 'Backlog')
    if (completing && preferences.celebrations !== false) setCelebrating(true)
  }
  function focus(card) {
    if (dataOf(timerSetting).running && dataOf(timerSetting).cardId && dataOf(timerSetting).cardId !== card.id) { setActionError('Pause the current focus block before choosing another card.'); setTimerOpen(true); return }
    setFocusedCardId(card.id); setTimerOpen(true)
  }
  async function saveSetting(key, value, capturedRecord) {
    const latest = workspaceRef.current.settings.find(row => dataOf(row).key === key)
    if (capturedRecord === null && latest) throw new Error('These settings were created while you were working. Refresh and review them before saving.')
    const record = capturedRecord === undefined ? latest : capturedRecord
    return save('settings', record, recordPayload(record, { title: key === 'preferences' ? 'Study preferences' : 'Focus timer', data: { ...dataOf(record), ...value, key } }))
  }
  async function logFocus(cardId, minutes, segmentId, endedAt) {
    const card = workspaceRef.current.cards.find(row => row.id === cardId)
    if (!card) throw new Error('The focus card is no longer available. Refresh the workspace.')
    const data = dataOf(card)
    if ((data.focusSessions ?? []).some(row => row.id === segmentId)) return
    const now = endedAt || new Date().toISOString()
    await patchCard(card, { actualHours: cardHours(card) + minutes / 60,
      focusSessions: [...(data.focusSessions ?? []), { id: segmentId, at: now, minutes, hours: minutes / 60 }],
      activity: [...(data.activity ?? []), { id: newId(), at: now, action: 'Logged focus session', details: `${minutes.toFixed(2)} minutes` }] })
  }
  async function restartCue(cardId, text) {
    if (!text) return
    const card = workspaceRef.current.cards.find(row => row.id === cardId)
    if (!card) throw new Error('The card is no longer available.')
    await patchCard(card, { notes: [...(dataOf(card).notes ?? []), { id: newId(), at: new Date().toISOString(), text: `Restart cue: ${text}` }] })
    setNotice('Restart note saved.')
  }
  async function reschedule(rows, date) {
    if (!date) throw new Error('Choose a new date first.')
    for (const row of rows) {
      const current = workspaceRef.current.cards.find(card => card.id === row.id)
      const dueTime = localClock(current.end_at) || dataOf(current).dueTime || ''
      const dates = cardDateFields(current.start_date, date, localClock(current.start_at), dueTime)
      await patchCard(current, { dueDate: date, dueDateTime: dates.end_at || date }, dates)
    }
    setNotice(`${rows.length} card deadline${rows.length === 1 ? '' : 's'} moved.`)
  }
  async function openMaterial(material) {
    setReader(material)
    quick(() => save('materials', material, { data: { ...dataOf(material), lastOpenedAt: new Date().toISOString() } }))
  }
  async function saveWorkbenchCard(card, change, action) {
    return doAction(() => save('cards', card, { data: workbenchData(card, change, action) }))
  }
  function markMaterialOpened(material) { quick(() => save('materials', material, { data: { ...dataOf(material), lastOpenedAt: new Date().toISOString() } })) }
  function markMaterialReviewed(material, reviewed) { quick(() => save('materials', material, { data: { ...dataOf(material), reviewed } })) }
  const actions = { modules: workspace.modules, onOpen: record => setEditor({ type: 'cards', record }), onDone: card => quick(() => done(card)), onFocus: focus }
  const edit = (type, record = null) => setEditor({ type, record })
  const commandResults = [...VIEWS.map(([id, title]) => ({ id, title, kind: 'view' })), ...workspace.modules.map(row => ({ ...row, kind: 'module' })), ...workspace.cards.map(row => ({ ...row, kind: 'card' })), ...workspace.materials.map(row => ({ ...row, kind: 'material' }))].filter(row => !commandQuery || [titleOf(row), dataOf(row).description, dataOf(row).code].join(' ').toLowerCase().includes(commandQuery.toLowerCase())).slice(0, 20)
  function renderView() {
    if (view === 'overview' || view === 'planner') return <><StudyOverview {...actions} cards={cards} modules={modules} parents={parents} sessions={contextSessions} semester={selectedSemester} preferences={preferences} contextCards={contextCards} activeModule={activeModule} today={today} progress={workspace.progress} onEdit={edit} onSelectModule={setModuleId} />{view === 'planner' && <section><h2>Needs attention</h2><CardList cards={stats.overdue.slice(0, 12)} {...actions} empty="No open overdue cards in this selection." /></section>}</>
    if (view === 'board') return <StudyBoard cards={cards} lanes={lanes} onLane={(card, value) => quick(() => lane(card, value))} {...actions} />
    if (view === 'table') return <StudyTable cards={cards} lanes={lanes} onLane={(card, value) => quick(() => lane(card, value))} {...actions} />
    if (view === 'week') return <StudyWeek cards={cards} today={today} {...actions} />
    if (view === 'progress') return <StudyProgress cards={cards} modules={modules} parents={parents} contextCards={contextCards} semester={selectedSemester} preferences={preferences} progress={workspace.progress} settings={workspace.settings} today={today} onEdit={edit} />
    if (view === 'evidence') return <StudyEvidence cards={cards} onOpen={actions.onOpen} />
    if (view === 'rescue') return <StudyRescue cards={cards} parents={parents} today={today} onOpen={actions.onOpen} onDone={done} onLane={lane} onReschedule={reschedule} />
    if (view === 'schedule') return <StudySchedule sessions={sessions} assessments={assessments} today={today} onEdit={edit} onOpenCard={id => { const record = workspace.cards.find(row => row.id === id); if (record) actions.onOpen(record); else setActionError('This session’s linked card is unavailable.') }} />
    if (view === 'assessments') return <StudyAssessments assessments={assessments} modules={modules} onEdit={edit} />
    if (view === 'materials') return <StudyMaterials materials={materials} workspace={workspace} semesterId={semesterId} moduleId={moduleId} discovery={discovery} onOpen={openMaterial} onEdit={edit} onReviewed={(row, reviewed) => quick(() => save('materials', row, { data: { ...dataOf(row), reviewed } }))} onUploaded={async () => { await refresh(true); setNotice('Material uploaded.') }} />
    if (view === 'history') return <StudyHistory workspace={workspace} onChanged={() => refresh(true)} />
    if (view === 'admin') return <><StudyAssessments assessments={assessments} modules={modules} onEdit={edit} /><section><h2>Semesters and modules</h2><div className="study-admin-list">{workspace.semesters.map(row => <button type="button" key={row.id} onClick={() => edit('semesters', row)}>{titleOf(row)} · {displayDate(row.start_date)} – {displayDate(row.end_date)}</button>)}{modules.map(row => <button type="button" key={row.id} onClick={() => edit('modules', row)}>{dataOf(row).code} · {titleOf(row)}</button>)}</div></section><section><h2>Waiting cards</h2><CardList cards={stats.waiting} {...actions} empty="No waiting cards in this selection." /></section><details><summary>Preserved study settings</summary>{workspace.settings.filter(row => !['preferences', 'focusTimer'].includes(dataOf(row).key)).map(row => <section key={row.id}><h3>{titleOf(row)}</h3><pre>{JSON.stringify(dataOf(row), null, 2)}</pre></section>)}</details></>
    return null
  }
  // An open draft keeps its original revision. A refreshed workspace cannot silently rebase it.
  const updatedEditor = editor?.record || null
  // One Life OS style drives every page; the dark grounds reuse Summer Rescue's dark component rules.
  const theme = ['madder', 'indigo'].includes(ground) ? 'dark' : 'light'
  const controls = <>
    <button type="button" className="primary-button" onClick={() => edit('cards')} disabled={loading || Boolean(loadError)}><StudyIcon name="plus" /><span>Add card</span></button>
    <StudyTimer setting={timerSetting} cards={workspace.cards} sessions={contextSessions} materials={workspace.materials} parents={parents} focusedCardId={focusedCardId} open={timerOpen} setOpen={setTimerOpen} onSaveTimer={(value, captured) => saveSetting('focusTimer', value, captured)} onLogFocus={logFocus} onRestartCue={restartCue} onSaveCard={saveWorkbenchCard} onMaterialOpen={markMaterialOpened} onReviewed={markMaterialReviewed} onCompleteCard={async id => { const card = workspaceRef.current.cards.find(row => row.id === id); if (!card) throw new Error('The card is no longer available.'); await done(card) }} />
    <MusicPopover theme={theme} url={musicUrl} onSetup={() => setPreferencesOpen(true)} />
    <button type="button" className="secondary-button" onClick={() => { setCommandQuery(''); setCommandOpen(true) }}>Search</button>
    <button type="button" className="secondary-button" onClick={() => setNotificationsOpen(true)} disabled={loading || Boolean(loadError)}>Notifications ({unread})</button>
    <StyleSwitch className="secondary-button" compact />
    <button type="button" className="icon-button" aria-label="Study preferences" onClick={() => setPreferencesOpen(true)} disabled={loading || Boolean(loadError)}><StudyIcon name="settings" /></button>
  </>
  return <section ref={shellRef} className="study-native srp-native" data-study-theme={theme} aria-label="Study Hub">
    <StudyShell view={view} views={VIEWS} onView={setView} modules={modules} moduleId={moduleId} onModule={setModuleId} semester={selectedSemester} stats={stats} sidebarCollapsed={Boolean(preferences.sidebarCollapsed)} onCollapse={() => quick(() => saveSetting('preferences', { ...dataOf(workspaceRef.current.settings.find(row => dataOf(row).key === 'preferences')), sidebarCollapsed: !preferences.sidebarCollapsed }))} controls={controls}>

    <div className="study-workspace-bar"><label>Semester<select value={semesterId} onChange={e => { scopeChosen.current = true; const selectedSemesterId = e.target.value; setSemesterId(selectedSemesterId); setModuleId(''); quick(() => saveSetting('preferences', { ...dataOf(workspaceRef.current.settings.find(row => dataOf(row).key === 'preferences')), selectedSemesterId })) }} disabled={loading}><option value="">All semesters</option>{workspace.semesters.map(row => <option value={row.id} key={row.id}>{titleOf(row)}</option>)}</select></label><label>Module<select value={moduleId} onChange={e => setModuleId(e.target.value)} disabled={loading}><option value="">All modules</option>{modules.map(row => <option value={row.id} key={row.id}>{moduleTitle(row)}</option>)}</select></label><div className="study-actions"><button type="button" onClick={() => edit('semesters')} disabled={loading || Boolean(loadError)}>Add semester</button><button type="button" onClick={() => edit('modules')} disabled={loading || Boolean(loadError)}>Add module</button><button type="button" className="study-primary" onClick={() => edit('cards')} disabled={loading || Boolean(loadError)}>Add card</button></div></div>

    <div className="study-actions study-tools"><Link to="/study" className="secondary-button">Study hub</Link><Link to="/calendar" className="secondary-button">Calendar</Link>{musicUrl && <a href={musicUrl} target="_blank" rel="noreferrer">Focus music</a>}<button type="button" disabled={loading || Boolean(loadError)} onClick={() => edit('sessions')}>Add timetable session</button><button type="button" disabled={loading || Boolean(loadError)} onClick={() => edit('assessments')}>Add assessment</button><button type="button" disabled={loading || Boolean(loadError)} onClick={() => edit('materials')}>Add material link</button><button type="button" disabled={loading || Boolean(loadError)} onClick={() => setImportOpen(true)}>Import</button><button type="button" disabled={loading || Boolean(loadError)} onClick={() => quick(async () => downloadJson(await apiFetch('/api/study/export'), `study-export-${today}.json`))}>Export</button><button type="button" onClick={() => refresh().catch(() => {})} disabled={loading}>Refresh</button><span className="study-save-status" role="status">{saving ? 'Saving…' : notice}</span></div>
    {actionError && <div className="study-error" role="alert">{actionError}<button type="button" onClick={() => { setActionError(''); refresh().catch(() => {}) }}>Refresh records</button></div>}
    {loading ? <p className="study-empty" role="status">Loading your Study workspace…</p> : loadError ? <div className="study-error" role="alert"><h2>Study could not load</h2><p>{loadError}</p><button type="button" onClick={() => refresh().catch(() => {})}>Try again</button><p>Your original Study is still available through its link above.</p></div> : <>
      {preferences.showWelcome !== false && !workspace.semesters.length && !workspace.cards.length && <div className="study-welcome"><h2>Start with a semester</h2><p>Add your modules by hand, or preview an import from a timetable, module handbook or your original Study workspace. Nothing is assumed about the current semester.</p><button type="button" onClick={() => edit('semesters')}>Add first semester</button></div>}
      {['overview', 'planner', 'board', 'table', 'week', 'progress', 'evidence', 'rescue'].includes(view) && <div className="study-filter-row"><label>Find cards<input type="search" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Title, notes or tags" /></label>{[['lane', 'Status', lanes], ['priority', 'Priority', preferences.priorities || DEFAULT_PRIORITIES], ['phase', 'Phase', phases], ['slot', 'Slot', preferences.slots || DEFAULT_SLOTS], ['tag', 'Tag', tags]].map(([key, label, values]) => <label key={key}>{label}<select value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}><option value="">All</option>{values.map(value => <option key={value}>{value}</option>)}</select></label>)}<label>Dates<select value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}>{[['', 'Any date'], ['today', 'Today'], ['week', 'Next seven days'], ['overdue', 'Overdue'], ['undated', 'Undated']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" onClick={() => setFilters(emptyFilters)}>Clear filters</button></div>}
      {['planner', 'rescue'].includes(view) && stats.overdue.length > 0 && <form className="study-bulk" onSubmit={event => { event.preventDefault(); quick(() => reschedule(stats.overdue, bulkDate)) }}><label>Move all {stats.overdue.length} overdue deadlines<input type="date" value={bulkDate} min={today} onChange={e => setBulkDate(e.target.value)} required /></label><button type="submit" disabled={saving || !bulkDate}>Reschedule all</button></form>}
      <div className="study-view">{renderView()}</div>
    </>}
    </StudyShell>
    <Celebration trigger={celebrating ? 1 : 0} host={typeof document === 'undefined' ? null : document.querySelector('.study-native dialog[open]') || shellRef.current} />
    {celebrating && <div className="study-celebration" role="status">One more piece of work finished.</div>}
    {editor && (editor.type === 'cards' ? <StudyCardEditor key={updatedEditor?.id || 'new-card'} record={updatedEditor} workspace={workspace} semesterId={semesterId} moduleId={moduleId} preferences={preferences} onSave={save} onDelete={remove} onClose={() => setEditor(null)} onFocus={focus} onOpenMaterial={openMaterial} /> : <StudyRecordEditor key={updatedEditor?.id || editor.type} type={editor.type} record={updatedEditor} workspace={workspace} semesterId={semesterId} moduleId={moduleId} onSave={save} onDelete={remove} onImported={() => refresh(true)} onClose={() => setEditor(null)} />)}
    {reader && <StudyReader material={reader} onClose={() => setReader(null)} />}
    {importOpen && <StudyImport key={`${semesterId}:${moduleId}`} semesterId={semesterId || activeModule?.semester_id || ''} moduleId={moduleId} semester={workspace.semesters.find(row => row.id === (semesterId || activeModule?.semester_id))} onClose={() => setImportOpen(false)} onApplied={async () => { await refresh(true); setNotice('Study import saved.') }} />}
    {preferencesOpen && <StudyPreferences preferences={preferences} record={preferencesRow} onClose={() => setPreferencesOpen(false)} onSave={(value, record) => saveSetting('preferences', value, record)} />}
    {notificationsOpen && <StudyDialog title="Study notifications" onClose={() => setNotificationsOpen(false)}><div className="study-form"><button type="button" disabled={!unread || saving} onClick={() => quick(() => saveSetting('preferences', { ...preferences, notificationReadIds: [...new Set([...notificationReadIds, ...notifications.map(row => row.id)])] }))}>Mark all read</button><ul className="study-history">{notifications.map((row, i) => <li key={`${row.id}-${i}`}><strong>{row.text}</strong>{row.body && row.body !== row.text && <p>{row.body}</p>}<div className="study-actions">{row.nativeCardId && <button type="button" onClick={() => { const card = workspace.cards.find(card => card.id === row.nativeCardId); if (card) actions.onOpen(card); setNotificationsOpen(false) }}>Open card</button>}<button type="button" disabled={row.read || notificationReadIds.includes(row.id) || saving} onClick={() => quick(() => saveSetting('preferences', { ...preferences, notificationReadIds: [...new Set([...notificationReadIds, row.id])] }))}>{row.read || notificationReadIds.includes(row.id) ? 'Read' : 'Mark read'}</button></div></li>)}</ul>{!notifications.length && <p className="study-empty">No current Study notifications in this selection.</p>}<details><summary>Preserved notifications ({preservedNotifications.length})</summary><p className="study-muted">These original notices remain as history. They do not add demands to the current semester.</p><ul className="study-history">{preservedNotifications.map((row, i) => <li key={`${row.id}-${i}`}><strong>{row.text}</strong>{row.body && <p>{row.body}</p>}<small>{row.read ? "Read in original Study" : "Preserved from original Study"}</small>{row.nativeCardId && <button type="button" onClick={() => { const card = workspace.cards.find(card => card.id === row.nativeCardId); if (card) actions.onOpen(card); setNotificationsOpen(false) }}>Open original card</button>}</li>)}</ul></details></div></StudyDialog>}
    {commandOpen && <StudyDialog title="Search Study" onClose={() => setCommandOpen(false)}><div className="study-form"><label>Views, modules, cards and materials<input autoFocus type="search" value={commandQuery} onChange={e => setCommandQuery(e.target.value)} placeholder="Type to find something" /></label><ul className="study-command-results">{commandResults.map(row => <li key={`${row.kind}-${row.id}`}><button type="button" onClick={() => { if (row.kind === 'view') setView(row.id); if (row.kind === 'module') { setSemesterId(row.semester_id || ''); setModuleId(row.id); setView('overview') } if (row.kind === 'card') actions.onOpen(row); if (row.kind === 'material') openMaterial(row); setCommandOpen(false) }}><span>{titleOf(row)}</span><small>{row.kind}</small></button></li>)}</ul>{!commandResults.length && <p className="study-empty">No matching Study items.</p>}</div></StudyDialog>}
  </section>
}
