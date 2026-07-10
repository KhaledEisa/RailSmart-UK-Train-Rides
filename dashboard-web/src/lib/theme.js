// Design tokens — the single source of truth for colour, chart chrome and glass
// surfaces. Nothing else in the app should hard-code a hex value (web skill A5:
// "no hex literals in components"). Swap a value here and the whole app follows.

// Brand — a warm gold on near-black. This is the product's identity colour and
// doubles as the single-hue for magnitude charts (revenue, counts, trends).
export const brand = {
  gold: '#C5A880',
  goldSoft: '#e0cba3',
  goldDeep: '#8c6f42',
  glow: 'rgba(197,168,128,0.35)',
}

// Status palette — reserved for state (good / warning / serious / critical),
// never reused as a "series colour" (dataviz non-negotiable). Tuned to read on
// the near-black surface and to stay distinct from the gold brand.
export const status = {
  good: '#34d399',
  warning: '#fbbf24',
  serious: '#fb923c',
  critical: '#f87171',
  neutral: '#9ca3af',
}

// Text tokens — labels/values/axes wear these, never the data colour.
export const ink = {
  primary: '#ffffff',
  secondary: 'rgba(255,255,255,0.72)',
  muted: 'rgba(255,255,255,0.46)',
  faint: 'rgba(255,255,255,0.30)',
}

export const surface = {
  base: '#05070b',
}

// Shared Recharts chrome. Fixes carried over from the dataviz skill:
// gridlines are hairline + solid (never dashed), area fills are a ~10% wash.
export const chart = {
  grid: 'rgba(255,255,255,0.07)',
  axisTick: { fill: 'rgba(255,255,255,0.55)', fontSize: 11 },
  cursor: { fill: 'rgba(255,255,255,0.05)' },
  tooltip: {
    backgroundColor: 'rgba(9,11,16,0.95)',
    border: '1px solid rgba(197,168,128,0.45)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 12,
    boxShadow: '0 12px 34px rgba(0,0,0,0.55)',
    padding: '8px 12px',
  },
  areaFillOpacity: 0.14,
}

// Glass surface class strings — one place so every panel matches.
export const glass =
  'rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-md'
export const glassStrong =
  'rounded-2xl border border-white/12 bg-black/35 backdrop-blur-md shadow-[0_14px_40px_rgba(0,0,0,0.5)]'

// Map an on-time percentage to a status colour (used by delay/reliability views).
export function onTimeColor(pct) {
  if (pct >= 90) return status.good
  if (pct >= 75) return status.warning
  if (pct >= 50) return status.serious
  return status.critical
}

// Map an on-time percentage to a human risk label.
export function onTimeRisk(pct) {
  if (pct >= 90) return 'Reliable'
  if (pct >= 75) return 'Watch'
  if (pct >= 50) return 'At risk'
  return 'Critical'
}
