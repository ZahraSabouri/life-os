import { Component } from 'react'
import { STORAGE_KEY } from '../state/storageKey'

function downloadLocalState() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const exportedAt = new Date().toISOString()
  const payload = raw
    ? JSON.stringify({ exportedAt, app: 'study-hub', state: JSON.parse(raw) }, null, 2)
    : JSON.stringify({ exportedAt, app: 'study-hub', state: null }, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `study-hub-crash-export-${exportedAt.replace(/[:.]/g, '-').slice(0, 19)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('The Study hub crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="crash-screen">
        <section className="crash-panel">
          <p className="eyebrow">Recovery mode</p>
          <h1>The app hit a render error.</h1>
          <p>Your browser copy is still in localStorage. Export it before refreshing or changing site data.</p>
          <div className="crash-actions">
            <button type="button" className="primary-button" onClick={downloadLocalState}>
              Export local JSON
            </button>
            <button type="button" className="secondary-button" onClick={() => window.location.reload()}>
              Reload app
            </button>
          </div>
          <pre>{this.state.error.message}</pre>
        </section>
      </main>
    )
  }
}
