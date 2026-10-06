import { useEffect, useRef } from 'react'

export default function StudyDialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.showModal()
    return () => { ref.current?.close(); previous?.focus?.() }
  }, [])
  return <dialog ref={ref} className={`study-dialog${wide ? ' study-dialog-wide' : ''}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <header className="study-dialog-head"><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}>Close</button></header>
    {children}
  </dialog>
}
