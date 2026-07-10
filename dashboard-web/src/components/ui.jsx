// Shared UI primitives. These kill the "glass card / stat card / badge" copy-paste
// that had spread across all three role views (core §1 DRY) and guarantee the
// three views read as one product.
import { useEffect, useState } from 'react'
import { brand, glass } from '../lib/theme.js'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Count-up number. Animates from 0 to `value` once on mount; honours the OS
// reduced-motion setting by starting (and staying) at the final value.
export function AnimatedNumber({ value, format = (v) => v, duration = 1100 }) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf = 0
    let start = 0
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{format(display)}</>
}

// A frosted-glass panel. `hover` adds a subtle lift used on interactive cards.
export function GlassCard({ className = '', hover = false, children, ...rest }) {
  return (
    <div
      className={`${glass} ${
        hover
          ? 'transition duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_16px_44px_rgba(0,0,0,0.5)]'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

// KPI / stat tile. `accent` colours the icon chip; `value` is already formatted.
export function StatCard({ icon: Icon, value, label, sub, accent = brand.gold }) {
  return (
    <GlassCard hover className="group flex items-center gap-4 p-4 md:p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 transition group-hover:scale-105"
        style={{ background: `${accent}1f`, color: accent }}
      >
        {Icon ? <Icon size={22} /> : null}
      </div>
      <div className="min-w-0">
        <div className="truncate text-2xl font-semibold leading-none text-white md:text-[1.7rem]">
          {value}
        </div>
        <div className="mt-1 truncate text-xs text-white/60 md:text-[0.8rem]">
          {label}
        </div>
        {sub ? <div className="mt-0.5 truncate text-[11px] text-white/40">{sub}</div> : null}
      </div>
    </GlassCard>
  )
}

// Coloured status pill. Pass an explicit `color` (from the status palette).
export function Badge({ color = brand.gold, children, className = '', dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ background: `${color}22`, color }}
    >
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      ) : null}
      {children}
    </span>
  )
}

// Section header: icon + title on the left, optional control slot on the right.
export function SectionHeader({ icon: Icon, title, kicker, right }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={18} style={{ color: brand.gold }} /> : null}
        <div>
          {kicker ? (
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/35">
              {kicker}
            </div>
          ) : null}
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

// Pill segmented toggle — the Monthly/Weekly style control, reusable.
export function SegToggle({ options, value, onChange }) {
  return (
    <div className="flex rounded-full border border-white/12 bg-white/5 p-0.5 text-[11px]">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        const active = val === value
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-full px-2.5 py-1 capitalize transition ${
              active ? 'text-black' : 'text-white/65 hover:text-white'
            }`}
            style={active ? { background: brand.gold } : undefined}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// A horizontal meter — track is a faint step of the same hue as the fill.
export function Meter({ value, max = 100, color = brand.gold, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full ${className}`}
      style={{ background: `${color}22` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

// Loading + error states shared by every data-driven view.
export function LoadingState({ label = 'Loading real figures…' }) {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-white/55">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/15"
          style={{ borderTopColor: brand.gold }}
        />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}

export function ErrorState({ error }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center text-white/70">
      <div>
        <div className="mb-1 text-sm font-semibold text-white">Couldn’t load the data</div>
        <div className="text-xs text-white/50">{String(error?.message || error)}</div>
      </div>
    </div>
  )
}

// Page heading used at the top of the Passenger / Manager views.
export function PageHeader({ badge, title, subtitle }) {
  return (
    <div className="mb-6">
      <span
        className="rounded-full border px-3 py-1 text-xs font-medium"
        style={{
          borderColor: `${brand.gold}66`,
          background: `${brand.gold}1a`,
          color: brand.gold,
        }}
      >
        {badge}
      </span>
      <h1 className="mt-3 text-2xl font-semibold text-white md:text-[2rem]">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
    </div>
  )
}
