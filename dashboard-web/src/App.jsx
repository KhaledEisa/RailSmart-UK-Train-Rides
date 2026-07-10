import { useEffect, useState } from 'react'
import { Database, Users, Wrench, TrainFront } from 'lucide-react'
import DataEngineerDashboard from './roles/DataEngineerDashboard.jsx'
import UserSite from './roles/UserSite.jsx'
import StationManager from './roles/StationManager.jsx'
import Background from './components/Background.jsx'
import LandingIntro from './components/LandingIntro.jsx'
import { brand } from './lib/theme.js'

const ROLES = [
  { id: 'data-engineer', label: 'Data Engineer', icon: Database, view: DataEngineerDashboard, desc: 'Pipelines & data quality' },
  { id: 'passenger', label: 'Passenger', icon: Users, view: UserSite, desc: 'Book & explore journeys' },
  { id: 'station-manager', label: 'Station Manager', icon: Wrench, view: StationManager, desc: 'Fleet & operations' },
]

const hashRole = () => window.location.hash.replace('#', '')
const isRole = (h) => ROLES.some((r) => r.id === h)
const roleFromHash = () => (isRole(hashRole()) ? hashRole() : 'data-engineer')

// Module-scope so the URL write stays outside component/hook scope.
const writeHash = (id) => {
  window.location.hash = id
}

export default function App() {
  const [role, setRole] = useState(roleFromHash)
  // Show the opening logo sequence on a cold load; skip it when a deep link
  // (#passenger etc.) already names a workspace so shared URLs land directly.
  const [entered, setEntered] = useState(() => isRole(hashRole()))
  const active = ROLES.find((r) => r.id === role) ?? ROLES[0]
  const View = active.view

  // deep links: #data-engineer / #passenger / #station-manager
  useEffect(() => {
    const onHash = () => setRole(roleFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const selectRole = (id) => {
    writeHash(id)
    setRole(id)
  }

  const enterAs = (id) => {
    selectRole(id)
    setEntered(true)
  }

  if (!entered) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden text-white">
        <Background />
        <LandingIntro roles={ROLES} onSelect={enterAs} />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full text-white">
      <Background />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2.5 md:px-6">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10"
                style={{ background: `${brand.gold}1f` }}
              >
                <TrainFront size={18} style={{ color: brand.gold }} />
              </div>
              <span className="text-sm font-semibold tracking-wide md:text-base">
                RailSmart{' '}
                <span className="hidden text-white/45 sm:inline">· UK Rail Intelligence</span>
              </span>
            </div>

            <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              {ROLES.map((r) => {
                const Icon = r.icon
                const isActive = r.id === role
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRole(r.id)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition md:text-sm ${
                      isActive
                        ? 'text-black'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    style={
                      isActive
                        ? { background: brand.gold, boxShadow: `0 0 22px ${brand.glow}` }
                        : undefined
                    }
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{r.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </header>

        {/* key on role => the view remounts and replays its fade-in on switch */}
        <main key={role} className="flex-1 animate-fade-up">
          <View />
        </main>

        <footer className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-white/35 md:px-6">
          RailSmart · every figure computed from the cleaned UK rail dataset (31,653
          journeys · Jan–Apr 2024). Fleet &amp; live states are simulated from real route
          reliability.
        </footer>
      </div>
    </div>
  )
}
