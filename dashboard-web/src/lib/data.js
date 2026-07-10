import { useEffect, useState } from 'react'

// Generic JSON loader for any file under public/ (path relative to BASE_URL).
// Every data-driven view goes through this one hook (core §1 DRY).
export function useJson(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}${path}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
    return () => {
      alive = false
    }
  }, [path])

  return { data, error }
}

// The Data Engineer dashboard figures (thin wrapper over useJson).
export function useDashboardData() {
  return useJson('data/dashboard_data.json')
}

// Compact GBP, e.g. 741921 -> "£741.9K", 458494 -> "£458.5K".
export function gbpCompact(value) {
  if (value == null) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `£${(value / 1_000).toFixed(1)}K`
  return `£${Math.round(value)}`
}

// Full GBP, e.g. 741921 -> "£741,921".
export function gbpFull(value) {
  if (value == null) return '—'
  return `£${Math.round(value).toLocaleString('en-GB')}`
}

export function intComma(value) {
  if (value == null) return '—'
  return Math.round(value).toLocaleString('en-GB')
}
