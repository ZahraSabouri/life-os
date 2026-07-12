import './manuscript.css'

export const MANUSCRIPT_GROUNDS = {
  paper: {
    key: 'paper',
    dark: false,
    bg: '#ece0c4',
    bg2: '#e4d4b1',
    background: '#ece0c4',
    ink: '#3a2f27',
    sub: '#83725d',
    muted: '#83725d',
    gold: '#a9702a',
    coral: '#b0512f',
    red: '#a03a2a',
    deep: '#d3bd94',
    line: 'rgba(58, 47, 39, 0.20)',
    leaf: '#fbf3dd',
  },
  madder: {
    key: 'madder',
    dark: true,
    bg: '#6d211a',
    bg2: '#84291d',
    background: '#6d211a',
    ink: '#f1e6ca',
    sub: '#d8b7a0',
    muted: '#d8b7a0',
    gold: '#e2b357',
    coral: '#dd8b63',
    red: '#e08a6d',
    deep: '#3c0f09',
    line: 'rgba(241, 230, 202, 0.20)',
    leaf: 'rgba(241, 230, 202, 0.05)',
  },
  indigo: {
    key: 'indigo',
    dark: true,
    bg: '#141a2e',
    bg2: '#1c2440',
    background: '#141a2e',
    ink: '#ecdfbf',
    sub: '#9aa0b6',
    muted: '#9aa0b6',
    gold: '#d9a94a',
    coral: '#cf7a5c',
    red: '#e08a6d',
    deep: '#080c1a',
    line: 'rgba(236, 223, 191, 0.17)',
    leaf: 'rgba(236, 223, 191, 0.05)',
  },
}

export const MODULE_ACCENTS = {
  aml: { paper: '#2a9d8f', dark: '#6fb3a6' },
  'applied ml': { paper: '#2a9d8f', dark: '#6fb3a6' },
  'time-series': { paper: '#3a5ba0', dark: '#7c9ec2' },
  'time series': { paper: '#3a5ba0', dark: '#7c9ec2' },
  mat700: { paper: '#a9702a', dark: '#d9a94a' },
  'team-project': { paper: '#a05a44', dark: '#c9917f' },
  'team project': { paper: '#a05a44', dark: '#c9917f' },
  'group project': { paper: '#a05a44', dark: '#c9917f' },
}

const FALLBACK_ACCENTS = [
  { paper: '#2a6157', dark: '#8fd0c3' },
  { paper: '#7c4b2a', dark: '#e8b98a' },
  { paper: '#31456e', dark: '#9fb4e8' },
  { paper: '#6e3550', dark: '#dca0c0' },
]

const SECTION_ITEMS = [
  { id: 'desk', label: 'Desk' },
  { id: 'chapters', label: 'Chapters' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'chronicle', label: 'Chronicle' },
]

export function normaliseGround(value) {
  return Object.prototype.hasOwnProperty.call(MANUSCRIPT_GROUNDS, value) ? value : 'paper'
}

export function paletteFor(ground = 'paper') {
  return MANUSCRIPT_GROUNDS[normaliseGround(ground)]
}

export function alpha(color, opacity = 1) {
  const amount = Math.max(0, Math.min(1, Number(opacity) || 0))
  const value = String(color ?? '').trim()
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(value)
  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value)
  if (shortHex) {
    const [, r, g, b] = shortHex
    return `rgba(${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(b + b, 16)}, ${amount})`
  }
  if (longHex) {
    const [, r, g, b] = longHex
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${amount})`
  }
  return `color-mix(in srgb, ${value || 'currentColor'} ${amount * 100}%, transparent)`
}

function stableIndex(value, length) {
  let hash = 0
  for (const character of String(value ?? 'study')) hash = (hash * 31 + character.charCodeAt(0)) | 0
  return Math.abs(hash) % length
}

export function moduleAccent(module, ground = 'paper') {
  const resolvedGround = normaliseGround(ground)
  const custom = module?.manuscriptAccent
  if (typeof custom === 'string' && custom.startsWith('#')) return custom
  if (custom && typeof custom === 'object') {
    const candidate = resolvedGround === 'paper' ? custom.paper : custom.dark
    if (candidate) return candidate
  }

  const keys = [module?.id, module?.viewId, module?.moduleGroup, module?.label, module?.title]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
  const mapped = keys.map((key) => MODULE_ACCENTS[key]).find(Boolean)
  const accents = mapped ?? FALLBACK_ACCENTS[stableIndex(keys[0], FALLBACK_ACCENTS.length)]
  return resolvedGround === 'paper' ? accents.paper : accents.dark
}

function formatLongDate(value) {
  if (!value) return 'Date not set'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatPersianDate(value) {
  if (!value) return ''
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-GB-u-ca-persian', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

function campaignText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return [value.phase, value.day && value.total ? `day ${value.day} of ${value.total}` : '', value.detail]
    .filter(Boolean)
    .join(' · ')
}

export function Khatam({ size = 15, className = '', label }) {
  return (
    <svg
      className={`ms-khatam ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect x="5.5" y="5.5" width="13" height="13" />
      <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" />
    </svg>
  )
}

export function Diamond({
  state = 'open',
  color,
  size = 'md',
  className = '',
  label,
}) {
  const style = {
    ...(color ? { '--ms-diamond-color': color } : {}),
    ...(typeof size === 'number' ? { '--ms-diamond-size': `${size}px` } : {}),
  }
  const sizeClass = typeof size === 'number' ? 'custom' : size
  return (
    <span
      className={`ms-diamond ms-diamond--${state} ms-diamond--${sizeClass} ${className}`.trim()}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

export function Rubric({ children, tone = 'red', className = '', ...paragraphProps }) {
  return (
    <p className={`ms-rubric ms-rubric--${tone} ${className}`.trim()} {...paragraphProps}>
      {children}
    </p>
  )
}

export function DottedLeader({ className = '' }) {
  return <span className={`ms-dotted-leader ${className}`.trim()} aria-hidden="true" />
}

export function ActionButton({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...buttonProps
}) {
  return (
    <button
      type={type}
      className={`ms-action ms-action--${variant} ms-action--${size} ${className}`.trim()}
      {...buttonProps}
    >
      {children}
    </button>
  )
}

export function GroundSwitch({ ground = 'paper', onChange, className = '' }) {
  const resolvedGround = normaliseGround(ground)
  return (
    <fieldset className={`ms-ground-switch ${className}`.trim()} aria-label="Change the manuscript ground">
      <legend className="ms-visually-hidden">Change the manuscript ground</legend>
      {Object.keys(MANUSCRIPT_GROUNDS).map((item) => (
        <button
          key={item}
          type="button"
          className="ms-ground-choice"
          data-choice={item}
          aria-label={`${item} ground`}
          title={`Switch to the ${item} ground`}
          aria-pressed={resolvedGround === item}
          onClick={() => onChange?.(item)}
        >
          <span aria-hidden="true" />
        </button>
      ))}
    </fieldset>
  )
}

export function ModuleSwitch({
  items = [],
  activeId,
  onChange,
  label = 'Choose view',
  className = '',
}) {
  return (
    <div className={`ms-module-switch ${className}`.trim()} role="group" aria-label={label}>
      {items.map((rawItem) => {
        const item = typeof rawItem === 'string' ? { id: rawItem, label: rawItem } : rawItem
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            className="ms-module-switch__item"
            aria-pressed={active}
            disabled={item.disabled}
            onClick={() => onChange?.(item.id)}
          >
            <span>{item.label}</span>
            {item.count != null && <small>{item.count}</small>}
          </button>
        )
      })}
    </div>
  )
}

export function ProgressBar({ value = 0, max = 100, tone = 'gold', label, className = '' }) {
  const safeMax = Math.max(1, Number(max) || 1)
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0))
  const percentage = (safeValue / safeMax) * 100
  return (
    <span
      className={`ms-progress ms-progress--${tone} ${className}`.trim()}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
    >
      <span style={{ width: `${percentage}%` }} />
    </span>
  )
}

export function StreakRing({ value = 0, max = 14, size = 46, label }) {
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const safeMax = Math.max(1, Number(max) || 1)
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0))
  const progress = safeValue / safeMax
  return (
    <svg
      className="ms-streak-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `${safeValue} day study streak`}
    >
      <circle className="ms-streak-ring__track" cx={size / 2} cy={size / 2} r={radius} />
      <circle
        className="ms-streak-ring__value"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeDasharray={`${circumference * progress} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy="0.36em" textAnchor="middle">
        {safeValue}
      </text>
    </svg>
  )
}

export function ManuscriptPage({
  ground = 'paper',
  activeSection = 'Desk',
  onGroundChange,
  onNavigate,
  onOpenCommand,
  onOpenSettings,
  onOpenNotifications,
  referenceDate,
  campaignLabel = 'Study campaign',
  campaignMeta,
  children,
  className = '',
}) {
  const resolvedGround = normaliseGround(ground)
  const activeId = String(activeSection).toLowerCase()
  const metaText = campaignText(campaignMeta)

  return (
    <section
      className={`ms-manuscript ms-manuscript--${resolvedGround} ${className}`.trim()}
      data-ms-ground={resolvedGround}
    >
      <div className="ms-page-frame" aria-hidden="true" />
      <div className="ms-page-frame ms-page-frame--inner" aria-hidden="true" />
      <span className="ms-page-seam" aria-hidden="true">
        <Khatam size={15} />
      </span>

      <div className="ms-page-content">
        <header className="ms-page-header">
          <div className="ms-page-provenance">
            <span className="ms-page-breadcrumb">
              <button
                type="button"
                className="ms-page-breadcrumb-home"
                onClick={() => onNavigate?.('court')}
                title="Back to the Court (Life OS)"
              >
                THE COURT
              </button>
              <i aria-hidden="true">›</i> <strong>STUDY</strong>
            </span>
            <span className="ms-page-rule" aria-hidden="true" />
            <span className="ms-page-campaign">
              {campaignLabel}
              {metaText ? ` · ${metaText}` : ''}
            </span>
            <time dateTime={referenceDate} className="ms-page-date">
              {formatLongDate(referenceDate)}
            </time>
            <span className="ms-page-persian-date">{formatPersianDate(referenceDate)}</span>
          </div>

          <div className="ms-page-navigation-row">
            <nav className="ms-page-navigation" aria-label="Study manuscript sections">
              {SECTION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={activeId === item.id ? 'page' : undefined}
                  onClick={() => onNavigate?.(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="ms-page-utilities">
              <GroundSwitch ground={resolvedGround} onChange={onGroundChange} />
              {onOpenNotifications && (
                <button type="button" onClick={onOpenNotifications} aria-label="Open the Herald">
                  herald
                </button>
              )}
              {onOpenSettings && (
                <button type="button" onClick={onOpenSettings} aria-label="Open Study settings">
                  settings
                </button>
              )}
              {onOpenCommand ? (
                <button type="button" onClick={onOpenCommand} aria-label="Open command search">
                  search <kbd>⌘K</kbd>
                </button>
              ) : (
                <span>
                  search <kbd>⌘K</kbd>
                </span>
              )}
            </div>
          </div>
        </header>
        <div className="ms-page-body">{children}</div>
      </div>
    </section>
  )
}
