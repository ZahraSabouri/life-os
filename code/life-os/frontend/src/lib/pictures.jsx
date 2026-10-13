// Pictures kept with an entry: sending them, and showing them. A picture is asked for with the
// same token as everything else, so it is read as a blob and shown from memory.
import { useEffect, useState } from 'react'
import { apiBlob, apiFetch } from './api.js'

export const MAX_PICTURE_BYTES = 8 * 1024 * 1024
const read = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
  reader.onerror = () => reject(new Error(`${file.name} could not be read`))
  reader.readAsDataURL(file)
})

// Sends each chosen picture to an entry. Returns what was kept and, in words, what was not.
export async function addPictures(entryId, files) {
  const kept = []
  const refused = []
  for (const file of Array.from(files ?? [])) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { refused.push(`${file.name} is not a JPEG, PNG, WebP or GIF picture`); continue }
    if (file.size > MAX_PICTURE_BYTES) { refused.push(`${file.name} is over 8 MB`); continue }
    try { kept.push(await apiFetch('/api/files', { method: 'POST', body: JSON.stringify({ entry_id: entryId, name: file.name, data: await read(file) }) })) } catch (failure) { refused.push(`${file.name}: ${failure.message}`) }
  }
  return { kept, refused }
}
export const removePicture = (id) => apiFetch(`/api/files/${encodeURIComponent(id)}`, { method: 'DELETE' })

const cache = new Map()
function usePicture(id) {
  const [url, setUrl] = useState(() => cache.get(id) ?? '')
  useEffect(() => {
    if (cache.has(id)) { setUrl(cache.get(id)); return undefined }
    let off = false
    apiBlob(`/api/files/${encodeURIComponent(id)}`).then((blob) => { const made = URL.createObjectURL(blob); cache.set(id, made); if (!off) setUrl(made) }).catch(() => { if (!off) setUrl('') })
    return () => { off = true }
  }, [id])
  return url
}

export function Picture({ id, alt = '', className = '', onOpen }) {
  const url = usePicture(id)
  if (!url) return <span className={`picture is-waiting ${className}`.trim()} aria-hidden="true" />
  const image = <img src={url} alt={alt} loading="lazy" />
  return onOpen ? <button type="button" className={`picture ${className}`.trim()} onClick={() => onOpen(id)} title="Show it larger">{image}</button> : <span className={`picture ${className}`.trim()}>{image}</span>
}

// One picture, large, over the page. Escape or a click outside closes it.
export function PictureLarge({ id, onClose, onRemove }) {
  const url = usePicture(id)
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="picture-large" role="dialog" aria-modal="true" aria-label="Picture" onClick={onClose}>
    <figure onClick={(event) => event.stopPropagation()}>
      {url ? <img src={url} alt="" /> : <p>Opening…</p>}
      <figcaption>{onRemove ? <button type="button" className="is-quiet" onClick={() => onRemove(id)}>Remove this picture</button> : <span />}<button type="button" onClick={onClose} autoFocus>Close</button></figcaption>
    </figure>
  </div>
}
