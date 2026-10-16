// The Guide's diagrams: drawn by the page from the style's own colours, so they follow the
// style and dark mode. Each is named by a step's `figure` in guide/chapters.js. Their boxes
// are links: to the part's page in the Guide, or to the page of the app itself.
import { Link } from 'react-router-dom'

// What each part keeps, and where in Life OS it then shows.
function PartsMap() {
  const rows = [
    ['Study hub', 'cards, study blocks, classes, tests', ['Today: the day’s path and Study', 'Calendar', 'Review and Analysis', 'The bell'], 'study'],
    ['JobMap', 'jobs to apply for, closing dates, follow-ups', ['Today: Jobs', 'Calendar', 'Review and Analysis', 'The bell'], 'jobmap'],
    ['Budget', 'shopping lists, meals, food at home, money', ['Today: Home', 'Calendar (renewals)', 'Review and Analysis', 'The bell'], 'budget'],
    ['Cardiff Life', 'events you chose or added', ['Calendar', 'Today: “Also today”', 'Court: Ahead'], 'cardiff'],
    ['Health', 'sessions, appointments, diet, UK recipes', ['Today: Health', 'Calendar (under Health)', 'The bell', 'Budget: your recipes'], 'health'],
    ['Life OS itself', 'your plans, notes, journal, people, focus time', ['Court, Today, Plan the week', 'Journal and People', 'Review and Analysis'], 'court'],
  ]
  const page = (words) => (/^Budget/.test(words) ? '/budget#/meals/recipes' : /^Today/.test(words) ? '/today' : /^Calendar/.test(words) ? '/calendar' : /^Review/.test(words) ? '/review' : /^Court/.test(words) ? '/court' : /^Journal/.test(words) ? '/journal' : /bell/.test(words) ? '/guide/focus' : '/guide')
  return <div className="guide-figure guide-map" role="img" aria-label={`What each part gives to Life OS: ${rows.map(([part, gives, shows]) => `${part} gives ${gives}, shown on ${shows.join(', ')}`).join('. ')}`}>
    <div className="guide-map-heads" aria-hidden="true"><span>Where it is kept</span><span>What flows in</span><span>Where you see it in Life OS</span></div>
    {rows.map(([part, gives, shows, id]) => <div className="guide-map-row" key={part}>
      <Link className="guide-box is-part" to={`/guide/${id}`} title={`How ${part} works`}>{part}</Link>
      <div className="guide-arrow" aria-hidden="true"><span>{gives}</span></div>
      <ul className="guide-box is-pages">{shows.map((words) => <li key={words}><Link to={page(words)}>{words}</Link></li>)}</ul>
    </div>)}
  </div>
}

// A row of steps with arrows between them. `branch` is a second, shorter row under it.
function Flow({ label, steps, branch = null }) {
  return <div className="guide-figure guide-flow" role="img" aria-label={`${label}: ${steps.map((step) => `${step.title} (${step.note})`).join(', then ')}${branch ? `. Or: ${branch.steps.map((step) => step.title).join(', ')}` : ''}`}>
    <ol aria-hidden="true" style={{ '--steps': steps.length }}>{steps.map((step, index) => <li key={`${step.when ?? ''}${step.title}`}>
      {step.when ? <small>{step.when}</small> : null}
      <b>{step.title}</b>
      <span>{step.note}</span>
      {index < steps.length - 1 ? <i /> : null}
    </li>)}</ol>
    {branch ? <div className="guide-flow-branch" aria-hidden="true"><span>{branch.label}</span><ol>{branch.steps.map((step) => <li key={step.title}><b>{step.title}</b><span>{step.note}</span></li>)}</ol></div> : null}
  </div>
}

const DAY = [
  { when: 'Morning', title: 'Court', note: 'Look at “Ahead”. Add what came to mind in one line.' },
  { when: 'Start', title: 'Today', note: 'Read the day in order. The bell says what is on now.' },
  { when: 'Work', title: 'Focus', note: 'Start a timer on a study card or on job applications.' },
  { when: 'As you go', title: 'Today', note: 'Tick a step, press “I applied”, tick what you bought.' },
  { when: 'Evening', title: 'Review', note: 'See the week so far and what slipped.' },
  { when: 'Sunday', title: 'Plan the week', note: 'Move plans, set repeating ones, check study time.' },
  { when: 'Now and then', title: 'Analysis', note: 'Look at weeks of data, or take it as a file.' },
]
const STUDY = [
  { title: 'A card', note: 'Made in the Study hub with “Add card”.' },
  { title: 'Time on the plan', note: 'A study block on a day, in the hub’s planner.' },
  { title: 'Steps ticked', note: 'On Today or in the hub. Both stay in step.' },
  { title: 'Focus time', note: 'The timer adds its minutes to the card.' },
  { title: 'Card done', note: '“Card done” on Today, or in the hub.' },
  { title: 'Looked back on', note: 'Review, Analysis, and the hub’s own Analytics.' },
]
const JOB = [
  { title: 'To review', note: 'A lead, found by a search or added by you.' },
  { title: 'Shortlist', note: 'The star, in the list or in the details.' },
  { title: 'Check details · Preparing', note: 'Status, in the job’s details.' },
  { title: 'Applied', note: '“I applied” on Today, or Status in JobMap. The date is kept.' },
  { title: 'Interview', note: 'Status in JobMap. It shows on Today.' },
  { title: 'Offer', note: 'Status in JobMap.' },
]
const JOB_ENDS = { label: 'At any point', steps: [{ title: 'Rejected', note: '“Rejected” on Today, or Status. It moves to the archive.' }, { title: 'Archived', note: 'Not for you. Kept, out of the way.' }] }

// Where each kind of thing is added by hand, and where it shows afterwards.
function WhereTable() {
  const rows = [
    ['A plan or a note', 'The add line: Court, Today, Plan the week', 'Today, Calendar, Ledger'],
    ['A plan that repeats', 'The add line, with “repeat”', 'Every day it falls on; listed under Plan the week'],
    ['Something to buy', 'The add line (“To buy”), or Budget → Shopping', 'Today (Home), Budget'],
    ['A study card', 'Study hub → Add card', 'Today when it is due or has a block, Calendar'],
    ['A class, a test, a deadline, a material link', 'Study hub → Semester setup', 'Calendar, Today, the bell'],
    ['A job', 'JobMap → Add job', 'Today (Jobs), Calendar (its closing date)'],
    ['Notes, categories, files and links on a job', 'JobMap → the job’s details', 'The job; your categories filter the list'],
    ['An event', 'Cardiff Life → + Add my own event', 'Calendar, Cardiff Life’s week'],
    ['A payment, a receipt, a meal, food at home', 'Budget', 'Today (Home), Review, Analysis'],
    ['Exercise you did or plan, a programme', 'Health → Exercise', 'Today (Health), Calendar, the bell'],
    ['An appointment, a test result, a measurement', 'Health → Appointments & tests', 'Calendar and the bell (appointments); Health'],
    ['Your diet, a UK recipe for your recipes', 'Health → Food', 'Budget → Meals & recipes'],
  ]
  return <div className="guide-figure guide-where"><table>
    <thead><tr><th scope="col">What</th><th scope="col">Add it here</th><th scope="col">It then shows on</th></tr></thead>
    <tbody>{rows.map(([what, where, shows]) => <tr key={what}><th scope="row">{what}</th><td>{where}</td><td>{shows}</td></tr>)}</tbody>
  </table></div>
}

// An illustration of the two notices Windows shows, and when each comes.
function NoticesPicture() {
  const Notice = ({ title, lines }) => <div className="guide-toast"><p className="guide-toast-app"><i aria-hidden="true" />Life OS</p><p className="guide-toast-title">{title}</p>{lines.map((line) => <p key={line}>{line}</p>)}</div>
  return <div className="guide-figure guide-notices">
    <div className="guide-desktop" role="img" aria-label="An illustration of two notices from Life OS at the corner of the Windows screen">
      <span className="guide-desktop-label" aria-hidden="true">Your screen, bottom right corner (an illustration)</span>
      <Notice title="MAT022 · Lecture" lines={['Starts at 13:10, in 10 minutes']} />
      <Notice title="Life OS: 3 things for today" lines={['2 study cards due today', 'Closes today: Data Analyst', '1 plan left unticked from earlier days']} />
    </div>
    <ul className="guide-when">
      <li><b>Before something starts</b><span>A class, a study block or a plan with a time: 10 minutes before (5 to 30, your choice in the bell’s panel).</span></li>
      <li><b>Once a day, from 08:00</b><span>What today asks for: cards due, jobs closing, plans left over.</span></li>
      <li><b>Only when no Life OS page is open</b><span>With a page open, the bell in the top bar tells you instead, so nothing is said twice.</span></li>
      <li><b>To switch it off</b><span>The bell → the bottom of its panel → untick “Tell me through Windows when no Life OS tab is open”.</span></li>
    </ul>
  </div>
}

export const FIGURES = {
  map: PartsMap,
  day: () => <Flow label="A day with Life OS" steps={DAY} />,
  where: WhereTable,
  notices: NoticesPicture,
  study: () => <Flow label="How a study card moves" steps={STUDY} />,
  job: () => <Flow label="A job from lead to answer" steps={JOB} branch={JOB_ENDS} />,
}
