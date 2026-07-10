// Design tokens for the mobile app — mirrors the web token system so the two
// products read as one. Plain JS values (no CSS) for React Native styles.
export const C = {
  bg: '#05070b',
  bg2: '#0a0f18',
  panel: 'rgba(255,255,255,0.05)',
  panelBorder: 'rgba(255,255,255,0.10)',
  gold: '#C5A880',
  goldSoft: '#e0cba3',
  goldDeep: '#8c6f42',
  ink: '#ffffff',
  ink70: 'rgba(255,255,255,0.72)',
  ink55: 'rgba(255,255,255,0.55)',
  ink45: 'rgba(255,255,255,0.46)',
  ink30: 'rgba(255,255,255,0.30)',
  good: '#34d399',
  warning: '#fbbf24',
  serious: '#fb923c',
  critical: '#f87171',
  neutral: '#9ca3af',
}

export function onTimeColor(pct) {
  if (pct >= 90) return C.good
  if (pct >= 75) return C.warning
  if (pct >= 50) return C.serious
  return C.critical
}

export const gbp = (v) =>
  v == null ? '—' : `£${Math.round(v).toLocaleString('en-GB')}`

export const gbpc = (v) => {
  if (v == null) return '—'
  const a = Math.abs(v)
  if (a >= 1e6) return `£${(v / 1e6).toFixed(1)}M`
  if (a >= 1e3) return `£${(v / 1e3).toFixed(1)}K`
  return `£${Math.round(v)}`
}

export const intc = (v) => (v == null ? '—' : Math.round(v).toLocaleString('en-GB'))
