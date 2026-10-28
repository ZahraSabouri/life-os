// The journal: a page for a day, in her own words, with a mood and pictures if she likes.
// Each page is an entry of the kind "journal" in the core, dated to its day.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAddress } from '../lib/addresses.js'
import { apiFetch } from '../lib/api.js'
import { formatCalendarDay } from '../lib/calendar.js'
import { addPictures, Picture, PictureLarge, removePicture } from '../lib/pictures.jsx'
import { removeEntry } from '../lib/plans.js'
import { useEntries } from '../lib/useEntries.js'
import { useLondonToday } from '../lib/useCalendar.js'
import EntryEditor from './EntryEditor.jsx'

const MOODS = ['Calm', 'Happy', 'Proud', 'Grateful', 'Tired', 'Anxious', 'Sad', 'Angry']
const dayOf = (entry) => String(entry.start_at || entry.created_at).slice(0, 10)
const titleFrom = (body, day) => { const first = body.trim().split(/\n/)[0].replace(/\s+/g, ' '); return first ? (first.length <= 78 ? first : `${first.slice(0, 75)}…`) : `Pictures, ${formatCalendarDay(day, { weekday: undefined })}` }

function Write({ today, onSaved }) {
  const [day, setDay] = useState(today)
  const [mood, setMood] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const [state, setState] = useState({ saving: false, error: '', said: '' })
  const picker = useRef(null)
  async function save(event) {
    event.preventDefault()
    if (state.saving || (!body.trim() && !files.length)) return
    setState({ saving: true, error: '', said: '' })
    try {
      const entry = await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({ type: 'journal', title: titleFrom(body, day), start_at: day, all_day: true, details: { ...(mood.trim() ? { mood: mood.trim().slice(0, 60) } : {}), ...(body.trim() ? { body: body.trim() } : {}) } }) })
      const sent = files.length ? await addPictures(entry.id, files) : { kept: [], refused: [] }
      setBody(''); setMood(''); setFiles([]); if (picker.current) picker.current.value = ''
      setState({ saving: false, error: sent.refused.length ? `Not kept: ${sent.refused.join('; ')}.` : '', said: `Saved for ${formatCalendarDay(day, { weekday: 'long' })}${sent.kept.length ? `, with ${sent.kept.length} ${sent.kept.length === 1 ? 'picture' : 'pictures'}` : ''}.` })
      onSaved()
    } catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}`, said: '' }) }
  }
  return <form className="day-panel journal-write" onSubmit={save} aria-label="Write in the journal">
    <div className="journal-write-top">
      <label>Day<input type="date" value={day} max={today} onChange={(event) => setDay(event.target.value || today)} /></label>
      <label className="journal-mood">How it felt<input value={mood} onChange={(event) => setMood(event.target.value)} list="journal-moods" placeholder="A word, if you like" maxLength={60} /></label>
      <datalist id="journal-moods">{MOODS.map((name) => <option key={name} value={name} />)}</datalist>
    </div>
    <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} placeholder="What happened, what you thought, what you want to remember…" aria-label="The page" maxLength={20000} />
    <div className="journal-write-foot">
      <label className="journal-add-pictures">{files.length ? `${files.length} ${files.length === 1 ? 'picture' : 'pictures'} chosen` : 'Add pictures'}<input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label>
      <button type="submit" className="journal-save" disabled={state.saving || (!body.trim() && !files.length)}>{state.saving ? 'Saving…' : 'Save the page'}</button>
      {state.said ? <span role="status">{state.said}</span> : null}
    </div>
    {state.error ? <p className="day-quiet day-warn" role="alert">{state.error}</p> : null}
  </form>
}

function Page({ entry, onChanged, onOpen }) {
  const [editing, setEditing] = useState(false)
  const [sure, setSure] = useState(false)
  const [state, setState] = useState({ busy: false, error: '' })
  const picker = useRef(null)
  async function more(files) {
    setState({ busy: true, error: '' })
    const sent = await addPictures(entry.id, files)
    if (picker.current) picker.current.value = ''
    setState({ busy: false, error: sent.refused.length ? `Not kept: ${sent.refused.join('; ')}.` : '' })
    onChanged()
  }
  const act = (work) => work.then(onChanged).catch((failure) => setState({ busy: false, error: failure.message }))
  const pictures = entry.files ?? []
  return <article className="day-panel journal-page" id={`journal-${entry.id}`}>
    <header><h2>{formatCalendarDay(dayOf(entry), { weekday: 'long', year: 'numeric' })}</h2>{entry.details?.mood ? <span className="journal-mood-said">{entry.details.mood}</span> : null}</header>
    {editing ? <EntryEditor entry={entry} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onChanged() }} /> : entry.details?.body ? <p className="journal-text">{entry.details.body}</p> : null}
    {pictures.length ? <div className="journal-pictures">{pictures.map((file) => <Picture key={file.id} id={file.id} alt={`A picture from ${formatCalendarDay(dayOf(entry))}`} onOpen={(id) => onOpen(id, entry)} />)}</div> : null}
    {state.error ? <p className="day-quiet day-warn" role="alert">{state.error}</p> : null}
    {editing ? null : <p className="day-stop-actions">
      <button type="button" onClick={() => setEditing(true)}>Change</button>
      <label className="journal-more">{state.busy ? 'Adding…' : 'Add pictures'}<input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={state.busy} onChange={(event) => more(event.target.files)} /></label>
      {sure ? <><button type="button" onClick={() => act(removeEntry(entry.id))}>Remove for good{pictures.length ? `, with its ${pictures.length === 1 ? 'picture' : 'pictures'}` : ''}</button><button type="button" onClick={() => setSure(false)}>Keep it</button></>
        : <button type="button" onClick={() => setSure(true)}>Remove</button>}
    </p>}
  </article>
}

export default function JournalView() {
  const today = useLondonToday()
  const all = useEntries('?limit=5000')
  // What is shown is in the address: Pictures (?view=pictures), the words found (?find=), a picture large (?picture=).
  const address = useAddress()
  const view = address.params.get('view') === 'pictures' ? 'pictures' : 'pages'
  const setView = (next) => address.show({ view: next === 'pictures' ? next : null })
  const asked = address.params.get('find') ?? ''
  const [words, setWords] = useState(asked)
  useEffect(() => { setWords(asked) }, [asked])
  useEffect(() => {
    if (words === asked) return undefined
    const timer = window.setTimeout(() => address.swap({ find: words.trim() ? words : null }), 250)
    return () => window.clearTimeout(timer)
  }, [words, asked, address])
  const pictureId = address.params.get('picture') ?? ''
  const large = pictureId ? { id: pictureId } : null
  const setLarge = (value) => (value ? address.open('picture', { picture: value.id }) : address.close(['picture']))
  const pages = useMemo(() => all.entries.filter((entry) => entry.type === 'journal' && !entry.archived).sort((a, b) => dayOf(b).localeCompare(dayOf(a)) || String(b.created_at).localeCompare(String(a.created_at))), [all.entries])
  const found = useMemo(() => {
    const asked = words.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return asked.length ? pages.filter((entry) => asked.every((word) => `${entry.title ?? ''} ${entry.details?.body ?? ''} ${entry.details?.mood ?? ''}`.toLowerCase().includes(word))) : pages
  }, [pages, words])
  const pictures = useMemo(() => pages.flatMap((entry) => (entry.files ?? []).map((file) => ({ ...file, entry }))), [pages])
  const months = useMemo(() => { const groups = new Map(); for (const entry of found) { const key = dayOf(entry).slice(0, 7); groups.set(key, [...(groups.get(key) ?? []), entry]) } return [...groups] }, [found])
  return <section className="today-layout unified-today day-page journal-layout" aria-label="Journal">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Journal</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{pages.length ? `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}${pictures.length ? ` · ${pictures.length} ${pictures.length === 1 ? 'picture' : 'pictures'}` : ''}` : 'A page for a day, in your own words'}</time></div>
    </header>
    <Write today={today} onSaved={all.refetch} />
    <div className="journal-tools">
      <div className="analysis-views" role="group" aria-label="What to show">
        <button type="button" aria-pressed={view === 'pages'} onClick={() => setView('pages')}>Pages</button>
        <button type="button" aria-pressed={view === 'pictures'} onClick={() => setView('pictures')}>Pictures</button>
      </div>
      {view === 'pages' ? <label className="journal-find"><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="Words in a page" /></label> : null}
      <Link className="journal-ledger" to="/ledger">Notes, plans and everything else you filed: the Ledger</Link>
    </div>
    {all.error ? <p className="form-error" role="alert">{all.error}</p> : null}
    {view === 'pictures' ? (pictures.length ? <div className="day-panel journal-gallery">{pictures.map((file) => <figure key={file.id}><Picture id={file.id} alt={`A picture from ${formatCalendarDay(dayOf(file.entry))}`} onOpen={(id) => setLarge({ id, entry: file.entry })} /><figcaption>{formatCalendarDay(dayOf(file.entry), { weekday: undefined, year: 'numeric' })}</figcaption></figure>)}</div>
      : <p className="day-quiet">No pictures yet. Add some to a page with “Add pictures”.</p>)
      : months.length ? months.map(([month, entries]) => <section key={month} className="journal-month" aria-label={formatCalendarDay(`${month}-01`, { weekday: undefined, day: undefined, month: 'long', year: 'numeric' })}>
        <h2 className="journal-month-name">{formatCalendarDay(`${month}-01`, { weekday: undefined, day: undefined, month: 'long', year: 'numeric' })}</h2>
        {entries.map((entry) => <Page key={entry.id} entry={entry} onChanged={all.refetch} onOpen={(id, owner) => setLarge({ id, entry: owner })} />)}
      </section>)
        : <p className="day-quiet">{all.loading ? 'Opening the journal…' : pages.length ? 'No page has those words.' : 'Nothing written yet. The first page starts in the box above.'}</p>}
    {large ? <PictureLarge id={large.id} onClose={() => setLarge(null)} onRemove={(id) => removePicture(id).then(() => { setLarge(null); all.refetch() }).catch(() => setLarge(null))} /> : null}
  </section>
}
