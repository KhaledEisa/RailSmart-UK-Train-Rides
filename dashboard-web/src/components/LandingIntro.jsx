import { useEffect, useState } from 'react'
import { brand } from '../lib/theme.js'

// Opening sequence shared by mobile + laptop: the RailSmart logo fades in, floats
// up and hands off to three persona buttons that rise in beneath it. Picking one
// fades the whole intro out and hands the chosen role back to <App>.
//
// Layout note: the whole thing lives in a single scrollable flow column (never
// absolute/fixed content), so on a short phone the buttons stay reachable — the
// page simply scrolls. The float-up motion is done with transforms only, which
// don't affect scroll height, so nothing can be pushed permanently off-screen.
// Honours prefers-reduced-motion by skipping straight to the docked state.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/railsmart-logo-light.svg`
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function LandingIntro({ roles, onSelect }) {
  // show: initial fade/scale-in · docked: floated up + buttons revealed
  const [show, setShow] = useState(prefersReducedMotion)
  const [docked, setDocked] = useState(prefersReducedMotion)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) return
    const raf = requestAnimationFrame(() => setShow(true))
    const dock = setTimeout(() => setDocked(true), 1400)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(dock)
    }
  }, [])

  // Let an impatient user tap through the centred reveal straight to the buttons.
  const skip = () => !docked && setDocked(true)

  const choose = (id) => {
    setLeaving(true)
    setTimeout(() => onSelect(id), prefersReducedMotion ? 0 : 480)
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain"
      style={{
        opacity: leaving ? 0 : 1,
        transition: `opacity 0.48s ${EASE}`,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      onClick={skip}
    >
      {/* min-h-full + my-auto centres the content when there's room but pins it
          to the top (fully scrollable) when it's taller than the viewport, e.g.
          a short landscape phone — justify-center would clip the top instead. */}
      <div className="flex min-h-full w-full flex-col items-center px-4 py-12 sm:py-16">
       <div className="my-auto flex w-full flex-col items-center gap-8">
        {/* Logo — fades/scales in, then floats up (transform only) as the
            buttons appear. Sits on a light plate so the light-background lockup
            stays legible on the near-black canvas. */}
        <div
          className="rounded-2xl px-6 py-5 sm:px-9 sm:py-7"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(240,232,214,0.92))',
            boxShadow: `0 24px 70px rgba(0,0,0,0.55), 0 0 60px ${brand.glow}`,
            border: '1px solid rgba(255,255,255,0.6)',
            opacity: show ? 1 : 0,
            transform: `translateY(${docked ? '0px' : '22px'}) scale(${show ? 1 : 0.86})`,
            transition: prefersReducedMotion
              ? 'none'
              : `transform 1s ${EASE}, opacity 0.9s ease`,
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={LOGO_SRC}
            alt="RailSmart — UK Rail Intelligence"
            className="block w-[220px] sm:w-[300px]"
            draggable={false}
          />
        </div>

        {/* Persona chooser — fades up once the logo has docked. Kept in flow so
            it always occupies real, scrollable height. */}
        <div
          className="w-full max-w-3xl"
          style={{
            opacity: docked ? 1 : 0,
            transform: `translateY(${docked ? '0' : '16px'})`,
            transition: prefersReducedMotion
              ? 'none'
              : `opacity 0.7s ${EASE} 0.25s, transform 0.7s ${EASE} 0.25s`,
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
      </div>
    </div>
  )
}
