import { useEffect, useState } from 'react'
import { brand } from '../lib/theme.js'

// Opening sequence shared by mobile + laptop: the RailSmart logo fades in dead
// centre, then floats up and shrinks to sit at the top-centre while three
// persona buttons rise in beneath it. Picking one fades the whole intro out and
// hands the chosen role back to <App>. Honours prefers-reduced-motion by
// skipping straight to the docked state.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/railsmart-logo-light.svg`
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function LandingIntro({ roles, onSelect }) {
  // show: initial fade/scale-in · docked: floated to top + buttons revealed
  const [show, setShow] = useState(prefersReducedMotion)
  const [docked, setDocked] = useState(prefersReducedMotion)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) return
    const raf = requestAnimationFrame(() => setShow(true))
    const dock = setTimeout(() => setDocked(true), 1500)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(dock)
    }
  }, [])

  // Let an impatient user tap through the centred reveal straight to the buttons.
  const skip = () => !docked && setDocked(true)

  const choose = (id) => {
    setLeaving(true)
    const t = setTimeout(() => onSelect(id), prefersReducedMotion ? 0 : 480)
    return () => clearTimeout(t)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{
        opacity: leaving ? 0 : 1,
        transition: `opacity 0.48s ${EASE}`,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      onClick={skip}
    >
      {/* Logo — starts centred, docks to the top. Sits on a light plate so the
          light-background lockup stays legible on the near-black canvas. */}
      <div
        className="absolute left-1/2"
        style={{
          top: docked ? '13%' : '50%',
          transform: `translate(-50%, -50%) scale(${docked ? 0.66 : show ? 1 : 0.86})`,
          opacity: show ? 1 : 0,
          transition: prefersReducedMotion
            ? 'none'
            : `top 1s ${EASE}, transform 1s ${EASE}, opacity 0.9s ease`,
          willChange: 'top, transform, opacity',
        }}
      >
        <div
          className="rounded-2xl px-6 py-5 sm:px-9 sm:py-7"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(240,232,214,0.92))',
            boxShadow: `0 24px 70px rgba(0,0,0,0.55), 0 0 60px ${brand.glow}`,
            border: '1px solid rgba(255,255,255,0.6)',
          }}
        >
          <img
            src={LOGO_SRC}
            alt="RailSmart — UK Rail Intelligence"
            className="block w-[220px] sm:w-[300px]"
            draggable={false}
          />
        </div>
      </div>

      {/* Persona chooser — fades up once the logo has docked. */}
      <div
        className="absolute left-1/2 w-full max-w-3xl px-4"
        style={{
          top: '46%',
          transform: `translateX(-50%) translateY(${docked ? '0' : '16px'})`,
          opacity: docked ? 1 : 0,
          transition: prefersReducedMotion
            ? 'none'
            : `opacity 0.7s ${EASE} 0.35s, transform 0.7s ${EASE} 0.35s`,
          pointerEvents: docked ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.35em] text-white/45 sm:text-sm">
          Choose your workspace
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => choose(r.id)}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-6 text-center backdrop-blur-md transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ transitionTimingFunction: EASE }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 transition group-hover:scale-110"
                  style={{ background: `${brand.gold}1f` }}
                >
                  <Icon size={22} style={{ color: brand.gold }} />
                </span>
                <span className="text-base font-semibold text-white">{r.label}</span>
                {r.desc && (
                  <span className="text-xs leading-snug text-white/50">{r.desc}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
