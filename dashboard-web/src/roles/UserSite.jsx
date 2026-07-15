import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, Tooltip } from 'recharts'
import {
  Home,
  Ticket,
  ArrowRight,
  Tag,
  Users,
  Video,
  Gauge,
  Clock,
  TrainFront,
} from 'lucide-react'
import { useJson, gbpFull } from '../lib/data.js'
import { brand, status, chart } from '../lib/theme.js'
import { useBookings } from '../lib/bookings.js'
import BookingModal from '../components/BookingModal.jsx'
import MyBookings from '../components/MyBookings.jsx'
import {
  GlassCard,
  Badge,
  SectionHeader,
  PageHeader,
  LoadingState,
  ErrorState,
} from '../components/ui.jsx'

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toHHMM = (min) => {
  const x = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

function crowdLevel(pct) {
  if (pct < 34) return { label: 'Quiet', color: status.good }
  if (pct < 67) return { label: 'Moderate', color: status.warning }
  return { label: 'Busy', color: status.critical }
}

// A conic-gradient ring showing a percentage (on-time rate).
function Ring({ pct, color, size = 66, label }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.09) 0deg)`,
        }}
      >
        <div className="grid place-items-center rounded-full bg-[#0a0d14]" style={{ width: size - 12, height: size - 12 }}>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      {label ? <span className="text-xs text-white/55">{label}</span> : null}
    </div>
  )
}

export default function UserSite() {
  const { data, error } = useJson('data/passenger_data.json')
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  // Only user *overrides* live in state; the effective origin/destination are
  // derived during render with sensible defaults. This avoids syncing derived
  // state through effects (no cascading renders).
  const [fromSel, setFromSel] = useState('')
  const [toSel, setToSel] = useState('')
  const [railcard, setRailcard] = useState(false)
  const [homeMins, setHomeMins] = useState(20)
  const [booking, setBooking] = useState(null) // active BookingModal trip, or null
  const [showBookings, setShowBookings] = useState(false)
  const bookings = useBookings()
  const activeBookings = bookings.filter((b) => b.status === 'confirmed').length

  const origins = useMemo(
    () =>
      data
        ? data.stations.filter((s) =>
            Object.values(data.routes).some((r) => r.from === s),
          )
        : [],
    [data],
  )

  const from = fromSel && origins.includes(fromSel) ? fromSel : origins[0] || ''

  const destinations = useMemo(() => {
    if (!data || !from) return []
    return Object.values(data.routes)
      .filter((r) => r.from === from)
      .map((r) => r.to)
  }, [data, from])

  const to = toSel && destinations.includes(toSel) ? toSel : destinations[0] || ''

  const setFrom = (v) => {
    setFromSel(v)
    setToSel('') // let the destination fall back to the new origin's first route
  }
  const setTo = setToSel

  if (error) return <ErrorState error={error} />
  if (!data) return <LoadingState label="Loading passenger data…" />

  const route = data.routes[`${from}->${to}`]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const discount = railcard ? 1 - data.railcardDiscount : 1
  const otColor =
    route && route.onTimeRate >= 90
      ? status.good
      : route && route.onTimeRate >= 75
        ? status.warning
        : status.critical

  const upcoming = route
    ? [...route.departures]
        .map((d) => ({ dep: d, depMin: toMin(d) }))
        .sort(
          (a, b) =>
            ((a.depMin - nowMin + 1440) % 1440) - ((b.depMin - nowMin + 1440) % 1440),
        )
        .slice(0, 5)
    : []
  const nextTrain = upcoming[0]
  const leaveBy = nextTrain ? toHHMM(nextTrain.depMin - homeMins) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          badge="Passenger"
          title="Plan your journey"
          subtitle="Live times, fares and crowd levels — built on the real UK rail dataset."
        />
        <button
          type="button"
          onClick={() => setShowBookings(true)}
          className="mt-1 flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/25 hover:text-white"
        >
          <Ticket size={16} style={{ color: brand.gold }} />
          <span className="hidden sm:inline">My bookings</span>
          {activeBookings > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-black" style={{ background: brand.gold }}>
              {activeBookings}
            </span>
          )}
        </button>
      </div>

      {/* Journey planner */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
          <Field label="From">
            <Select value={from} onChange={setFrom} options={origins} />
          </Field>
          <div className="hidden items-center justify-center pb-2.5 md:flex">
            <div className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5">
              <ArrowRight className="text-white/50" size={16} />
            </div>
          </div>
          <Field label="To">
            <Select value={to} onChange={setTo} options={destinations} />
          </Field>
          <Field label="Railcard">
            <button
              type="button"
              onClick={() => setRailcard((v) => !v)}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition"
              style={
                railcard
                  ? { borderColor: `${brand.gold}99`, background: `${brand.gold}22`, color: '#fff' }
                  : { borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.7)' }
              }
            >
              {railcard ? '⅓ off applied' : 'No railcard'}
            </button>
          </Field>
        </div>

        {route ? (
          <>
            {/* route summary strip */}
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <Ring pct={route.onTimeRate} color={otColor} label="on-time rate" />
              <div className="h-8 w-px bg-white/10" />
              <Metric icon={Clock} value={`${route.avgDurationMin} min`} label="avg journey" />
              <div className="h-8 w-px bg-white/10" />
              <Metric icon={Ticket} value={gbpFull(route.avgPrice * discount)} label="avg fare" accent />
              <div className="ml-auto">
                <Badge color={otColor} dot>
                  {route.onTimeRate >= 90 ? 'Reliable route' : route.onTimeRate >= 75 ? 'Usually on time' : 'Delay-prone'}
                </Badge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Departures board */}
              <div className="lg:col-span-2">
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/45">
                    <TrainFront size={13} style={{ color: brand.gold }} />
                    Live departures · {from}
                    <span className="ml-auto tabular-nums">{toHHMM(nowMin)}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {upcoming.map((u, i) => (
                      <div
                        key={u.dep}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
                        style={i === 0 ? { background: `${brand.gold}12` } : undefined}
                      >
                        <div className="font-mono text-xl font-bold tabular-nums" style={{ color: brand.gold }}>
                          {u.dep}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm text-white/85">{to}</div>
                          <div className="text-[11px] text-white/45">
                            arr {toHHMM(u.depMin + route.avgDurationMin)} · {route.avgDurationMin} min
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold" style={{ color: brand.gold }}>
                              {gbpFull(route.avgPrice * discount)}
                            </div>
                            {i === 0 ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: status.good }}>
                                Next · on time
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/40">Standard</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setBooking({ from, to, route, departure: u.dep, railcard })}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-105"
                            style={{ background: brand.gold }}
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* When to leave + fares */}
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <SectionHeader icon={Home} title="When to leave home" />
                  <label className="block text-xs text-white/55">
                    Home → station: <span className="text-white/80">{homeMins} min</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    value={homeMins}
                    onChange={(e) => setHomeMins(Number(e.target.value))}
                    className="mt-2 w-full"
                    style={{ accentColor: brand.gold }}
                  />
                  {leaveBy && (
                    <p className="mt-2 text-sm text-white/75">
                      Leave by{' '}
                      <span className="text-2xl font-bold tabular-nums" style={{ color: brand.gold }}>
                        {leaveBy}
                      </span>{' '}
                      to catch the {nextTrain.dep}.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <SectionHeader icon={Ticket} title="Fare options" />
                  <ul className="space-y-2 text-sm">
                    {Object.entries(route.fares).map(([type, price]) => (
                      <li key={type} className="flex items-center justify-between">
                        <span className="text-white/60">{type}</span>
                        <span className="font-medium tabular-nums">{gbpFull(price * discount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-5 text-sm text-white/55">
            No direct service for that pair in the dataset — pick another destination.
          </p>
        )}
      </GlassCard>

      {/* Crowdedness + AI counting */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CrowdPanel station={from} hourly={data.stationHourly[from]} hour={now.getHours()} />
        <PersonCountPanel />
      </div>

      {/* Offers */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold">
        <Tag size={18} style={{ color: brand.gold }} /> Top advance-booking offers
      </h2>
      <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.offers.map((o) => {
          const offerRoute = data.routes[`${o.from}->${o.to}`]
          return (
            <GlassCard
              key={`${o.from}-${o.to}`}
              hover
              className="cursor-pointer p-4"
              onClick={() =>
                offerRoute &&
                setBooking({ from: o.from, to: o.to, route: offerRoute, initialFare: 'Advance', railcard: false })
              }
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate">{o.from}</span>
                <ArrowRight size={13} className="shrink-0 text-white/40" />
                <span className="truncate">{o.to}</span>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-xl font-bold tabular-nums" style={{ color: brand.gold }}>
                  {gbpFull(o.advance)}
                </span>
                <span className="text-sm text-white/35 line-through tabular-nums">{gbpFull(o.anytime)}</span>
              </div>
              <div className="mt-1 text-xs font-medium" style={{ color: status.good }}>
                Save {gbpFull(o.saving)} ({o.pct}%) booking Advance
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold" style={{ color: brand.gold }}>
                Book this fare <ArrowRight size={12} />
              </div>
            </GlassCard>
          )
        })}
      </div>

      {booking && (
        <BookingModal
          trip={booking}
          onClose={() => setBooking(null)}
          onManage={() => setShowBookings(true)}
        />
      )}
      {showBookings && <MyBookings onClose={() => setShowBookings(false)} />}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/55">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}

function Metric({ icon: Icon, value, label, accent = false }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={accent ? '' : 'text-white/50'} style={accent ? { color: brand.gold } : undefined} />
      <div>
        <div className="text-sm font-semibold tabular-nums" style={accent ? { color: brand.gold } : undefined}>
          {value}
        </div>
        <div className="text-[11px] text-white/45">{label}</div>
      </div>
    </div>
  )
}

function CrowdPanel({ station, hourly, hour }) {
  if (!hourly) return null
  const live = hourly[hour]
  const lvl = crowdLevel(live)
  const chartData = hourly.map((v, h) => ({ h: `${h}`, v }))

  return (
    <GlassCard className="p-5">
      <SectionHeader
        icon={Gauge}
        title="Station crowdedness"
        right={<Badge color={lvl.color} dot>{lvl.label} now</Badge>}
      />
      <p className="-mt-1 mb-2 text-xs text-white/50">{station} · usual busyness by hour</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="h"
              interval={2}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={chart.cursor}
              contentStyle={chart.tooltip}
              formatter={(v) => [`${Math.round(v)}/100`, 'busyness']}
              labelFormatter={(l) => `${l}:00`}
            />
            <Bar dataKey="v" radius={[3, 3, 0, 0]} barSize={11}>
              {chartData.map((c, i) => (
                <Cell key={i} fill={i === hour ? brand.gold : 'rgba(197,168,128,0.26)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-white/45">
        The gold bar is the current hour. Levels blend popular-times with on-platform demand.
      </p>
    </GlassCard>
  )
}

function PersonCountPanel() {
  const src = `${import.meta.env.BASE_URL}demo/station_count.mp4`
  const [ok, setOk] = useState(true)
  return (
    <GlassCard className="p-5">
      <SectionHeader
        icon={Video}
        title="AI person counting"
        right={
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${status.critical}26`, color: status.critical }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.critical, animation: 'pulse-soft 1.4s infinite' }} /> LIVE
          </span>
        }
      />
      <p className="-mt-1 mb-2 text-xs text-white/50">YOLOv8 detection on the platform camera feed</p>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
        {ok ? (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setOk(false)}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-white/40">
            <Users size={32} />
            <span className="text-center text-xs">
              Demo clip not generated yet — run scripts/make_person_count_demo.py
            </span>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-white/45">
        Synthetic platform clip processed by a pretrained YOLO model (ultralytics). Point the
        same script at real CCTV to count live.
      </p>
    </GlassCard>
  )
}
