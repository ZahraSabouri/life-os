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
