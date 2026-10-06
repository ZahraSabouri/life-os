// The app's fixed vocabulary (how a card moves, its priority, its slot) and the lists that
// come from the open semester (its modules, its phases, its tags).
import { openSemester } from '../hub/session.js'

const session = openSemester()

const list = (value) => (Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [])
const options = session.plan?.options ?? {}

export const STATUS_OPTIONS = [
  'Today',
  'Yesterday',
  'Past Week',
  'Past Month',
  'This Week',
  'Deep Work',
  'Backlog',
  'Waiting / Blocked',
  'Rescue Lane',
  'Done',
]

export const STATUS_COLUMNS = [
  { id: 'Today', label: 'Today' },
  { id: 'Yesterday', label: 'Yesterday' },
  { id: 'Past Week', label: 'Past Week' },
  { id: 'Past Month', label: 'Past Month' },
  { id: 'This Week', label: 'This Week' },
  { id: 'Deep Work', label: 'Deep Work' },
  { id: 'Backlog', label: 'Backlog' },
  { id: 'Waiting / Blocked', label: 'Waiting' },
  { id: 'Rescue Lane', label: 'Rescue Lane' },
  { id: 'Done', label: 'Done' },
]

// Work that belongs to the semester as a whole rather than to one module.
export const GENERAL_GROUP = 'General'

export const PHASE_OPTIONS = list(options.phases).length > 0 ? list(options.phases) : ['Phase 1', 'Phase 2', 'Phase 3']

export const MODULE_OPTIONS = [...new Set([...session.modules.map((module) => module.moduleGroup), GENERAL_GROUP])]

export const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

export const SLOT_OPTIONS = ['AM', 'PM', 'Light/Eve', 'Fixed', 'Flex']

export const TAG_OPTIONS = list(options.tags).length > 0
  ? list(options.tags)
  : ['exam', 'coursework', 'project', 'reading', 'lab', 'revision', 'fixed', 'evidence']

// One view per module of the open semester, between the study views and the planning views.
export const MODULE_VIEWS = session.modules.map((module) => ({ id: module.viewId, label: module.label, moduleId: module.id }))

export const VIEW_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'hub', label: 'Study Hub' },
  { id: 'dashboard', label: 'Planner' },
  { id: 'progress', label: 'Progress' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'review', label: 'Review' },
  { id: 'general-knowledge', label: 'General Knowledge' },
  { id: 'notes', label: 'Notes' },
  ...MODULE_VIEWS,
  { id: 'board', label: 'Columns' },
  { id: 'table', label: 'Table' },
  { id: 'week', label: 'Week' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'rescue', label: 'Rescue Lane' },
  { id: 'setup', label: 'Semester setup' },
]

export const FILTER_DEFAULTS = {
  search: '',
  phase: 'all',
  module: 'all',
  modules: [],
  kind: 'all',
  priority: 'all',
  status: 'all',
  slotType: 'all',
  tag: 'all',
  dateMode: 'all',
  exactDate: '',
  dateFrom: '',
  dateTo: '',
}
