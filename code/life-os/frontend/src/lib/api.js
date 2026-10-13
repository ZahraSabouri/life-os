const TOKEN = import.meta.env.VITE_LIFE_OS_TOKEN || 'dev-token-change-me'

export async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...options.headers
    }
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }

  return response.json()
}

// Asks for a file and hands it to the browser to save, under the name the server gives it.
export async function apiDownload(path) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }
  const name = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? 'life-os-data'
  const url = URL.createObjectURL(await response.blob())
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return name
}

// A file kept by Life OS (a picture), read with the same token as everything else.
export async function apiBlob(path) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!response.ok) throw new Error(`Request failed with ${response.status}`)
  return response.blob()
}
