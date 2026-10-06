/* Icon markup transferred from Summer Rescue App.jsx with generic view names. */
export default function StudyIcon({ name }) {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  let body
  switch (name) {
    case 'brand':
      body = (
        <>
          <path {...p} d="M12 3c3.6 2.8 5.6 5.6 5.6 9.2A5.6 5.6 0 0 1 6.4 12.2c0-1.5.5-2.8 1.4-4" />
          <path {...p} d="M12 21v-8" />
        </>
      )
      break
    case 'today':
      body = (
        <>
          <circle {...p} cx="12" cy="13" r="6" />
          <path {...p} d="M12 10.5V13l2 2M12 3v2M4.6 5.6 6 7M19.4 5.6 18 7" />
        </>
      )
      break
    case 'hub':
      body = (
        <>
          <path {...p} d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path {...p} d="M3 13l9 5 9-5" />
        </>
      )
      break
    case 'module':
      body = (
        <>
          <rect {...p} x="7" y="7" width="10" height="10" rx="2" />
          <path {...p} d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
        </>
      )
      break
    case 'schedule':
      body = <path {...p} d="M3 12h3l2-6 4 12 3-8 1.5 3H21" />
      break
    case 'assessments':
      body = (
        <>
          <path {...p} d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" />
          <path {...p} d="M3 8l9 5 9-5M12 13v8" />
          <path {...p} d="M8 15l4 2 4-2" />
        </>
      )
      break
    case 'materials':
      body = (
        <>
          <circle {...p} cx="6" cy="6" r="1.3" />
          <circle {...p} cx="12" cy="6" r="1.3" />
          <circle {...p} cx="18" cy="6" r="1.3" />
          <circle {...p} cx="6" cy="12" r="1.3" />
          <circle {...p} cx="12" cy="12" r="1.3" />
          <circle {...p} cx="18" cy="12" r="1.3" />
          <circle {...p} cx="6" cy="18" r="1.3" />
          <circle {...p} cx="12" cy="18" r="1.3" />
          <circle {...p} cx="18" cy="18" r="1.3" />
        </>
      )
      break
    case 'dashboard':
      body = (
        <>
          <rect {...p} x="3" y="3" width="18" height="18" rx="2.5" />
          <path {...p} d="M3 9h18M9 21V9" />
        </>
      )
      break
    case 'progress':
      body = (
        <>
          <path {...p} d="M3 17l6-6 4 4 8-8" />
          <path {...p} d="M17 7h4v4" />
        </>
      )
      break
    case 'analytics':
      body = (
        <>
          <path {...p} d="M3 21h18" />
          <rect {...p} x="5" y="12" width="3" height="7" rx="1" />
          <rect {...p} x="10.5" y="6" width="3" height="13" rx="1" />
          <rect {...p} x="16" y="14" width="3" height="5" rx="1" />
        </>
      )
      break
    case 'board':
      body = (
        <>
          <rect {...p} x="3" y="4" width="5" height="16" rx="1.4" />
          <rect {...p} x="9.5" y="4" width="5" height="11" rx="1.4" />
          <rect {...p} x="16" y="4" width="5" height="16" rx="1.4" />
        </>
      )
      break
    case 'table':
      body = (
        <>
          <rect {...p} x="3" y="4" width="18" height="16" rx="2.5" />
          <path {...p} d="M3 9.5h18M3 15h18M9 4v16" />
        </>
      )
      break
    case 'week':
      body = (
        <>
          <rect {...p} x="3" y="5" width="18" height="16" rx="2.5" />
          <path {...p} d="M3 9.5h18M8 3v4M16 3v4" />
        </>
      )
      break
    case 'evidence':
      body = (
        <>
          <rect {...p} x="3" y="3" width="18" height="18" rx="3.5" />
          <path {...p} d="M8 12l3 3 5-6" />
        </>
      )
      break
    case 'rescue':
      body = (
        <>
          <circle {...p} cx="12" cy="12" r="9" />
          <circle {...p} cx="12" cy="12" r="3.6" />
          <path {...p} d="M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />
        </>
      )
      break
    case 'history':
      body = (
        <>
          <path {...p} d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" />
          <path {...p} d="M3 8l9 5 9-5M12 13v9" />
        </>
      )
      break
    case 'admin':
      body = (
        <>
          <path {...p} d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
          <path {...p} d="M9 12l2 2 4-4" />
        </>
      )
      break
    case 'settings':
      body = <path {...p} d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
      break
    case 'menu':
      body = <path {...p} d="M3 6h18M3 12h18M3 18h18" />
      break
    case 'chevron':
      body = <path {...p} d="M15 6l-6 6 6 6" />
      break
    case 'plus':
      body = <path {...p} d="M12 5v14M5 12h14" />
      break
    case 'close':
      body = <path {...p} d="M6 6l12 12M18 6 6 18" />
      break
    case 'sun':
      body = (
        <>
          <circle {...p} cx="12" cy="12" r="4" />
          <path {...p} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )
      break
    case 'moon':
      body = <path {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      break
    default:
      body = <circle {...p} cx="12" cy="12" r="8" />
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {body}
    </svg>
  )
}

