import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'

function normalizeQuery(query) {
  if (!query) return ''
  return query.startsWith('?') ? query : `?${query}`
}

export function useEntries(query = '?limit=10') {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const rows = await apiFetch(`/api/entries${normalizeQuery(query)}`)
      setEntries(rows)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}
