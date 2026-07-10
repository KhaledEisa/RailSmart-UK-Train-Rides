import { lazy, Suspense, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import {
  Users,
  TrainFront,
  Receipt,
  Coins,
  Armchair,
  Sofa,
  Crown,
  Orbit,
  Move3d,
  MapPin,
  Activity,
} from 'lucide-react'
// Three.js is the heaviest dependency in the app — code-split it so it only
// loads for this view, not in the initial bundle (web skill A6).
const TrainScene = lazy(() => import('../components/TrainScene.jsx'))
import { useDashboardData, gbpCompact, gbpFull, intComma } from '../lib/data.js'
import { brand, status, chart, ink } from '../lib/theme.js'
import {
  StatCard,
  GlassCard,
  SectionHeader,
  SegToggle,
  AnimatedNumber,
  LoadingState,
  ErrorState,
} from '../components/ui.jsx'

const TRAIN_COLORS = [
  { id: 'gold', value: brand.gold },
  { id: 'teal', value: '#3fb6a8' },
  { id: 'crimson', value: '#d8556b' },
  { id: 'azure', value: '#4d8df0' },
]

const SEAT_ICONS = [Armchair, Sofa, Crown]
const SEAT_TINTS = [
  'from-[#4b5563]/60 to-[#1f2937]/60',
  'from-[#7c6334]/60 to-[#2b2415]/60',
  'from-[#b08d4f]/65 to-[#3a2e16]/65',
]

// The three service outcomes, coloured from the reserved status palette.
const SERVICE = [
  { key: 'On Time', color: status.good },
  { key: 'Delayed', color: status.warning },
  { key: 'Cancelled', color: status.critical },
]

export default function DataEngineerDashboard() {
  const { data, error } = useDashboardData()
  const [trendMode, setTrendMode] = useState('monthly')
  const [autoRotate, setAutoRotate] = useState(true)
  const [trainColor, setTrainColor] = useState(TRAIN_COLORS[0].value)
  const [trainModel, setTrainModel] = useState('hst')

  if (error) return <ErrorState error={error} />
  if (!data) return <LoadingState label="Loading real figures…" />

  const { kpis, regional, seating, trend, status: svc } = data
  const trendData = trend[trendMode]
  const maxRegion = Math.max(...regional.map((r) => r.revenue))
  const avgFare = kpis.ticketValue / kpis.passengers
  const svcTotal = SERVICE.reduce((a, s) => a + (svc[s.key] || 0), 0)

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 p-4 md:p-6">
      {/* KPI row — real figures, animated on load */}
      <section className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          value={<AnimatedNumber value={kpis.passengers} format={(v) => intComma(v)} />}
          label="Ticketed passengers"
          sub={`${data.routes} routes · ${data.stations} stations`}
        />
        <StatCard
          icon={TrainFront}
          accent={status.good}
          value={<AnimatedNumber value={kpis.onTimeRate} format={(v) => `${v.toFixed(1)}%`} />}
          label="On-time performance"
          sub={`${intComma(svc['On Time'])} journeys`}
        />
        <StatCard
          icon={Receipt}
          value={<AnimatedNumber value={kpis.ticketValue} format={(v) => gbpCompact(v)} />}
          label="Total ticket value"
          sub={gbpFull(kpis.ticketValue)}
        />
        <StatCard
          icon={Coins}
          value={<AnimatedNumber value={avgFare} format={(v) => `£${v.toFixed(2)}`} />}
          label="Average fare"
          sub="per ticketed journey"
        />
      </section>

      {/* Interactive 3D train hero — set inside the real station concourse */}
      <section className="animate-fade-up relative min-h-[440px] flex-1 overflow-hidden rounded-2xl border border-white/10">
        {/* station backdrop */}
        <img
          src={`${import.meta.env.BASE_URL}assets/station-bg.webp`}
          alt="Station concourse"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5,7,11,0.55) 0%, rgba(5,7,11,0.15) 35%, rgba(5,7,11,0.65) 100%)',
          }}
        />
        {/* transparent 3D canvas on top */}
        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="grid h-full w-full place-items-center text-xs text-white/50">
                Loading 3D scene…
              </div>
            }
          >
            <TrainScene auto={autoRotate} color={trainColor} model={trainModel} />
          </Suspense>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] backdrop-blur-sm" style={{ color: brand.gold }}>
          <Move3d size={12} className="mr-1.5 inline" /> Drag to rotate · scroll to zoom
        </div>

        {/* model switch */}
        <div className="absolute left-3 top-3 flex rounded-full border border-white/12 bg-black/50 p-0.5 text-[11px] backdrop-blur-md">
          {[
            { id: 'stylized', label: 'Stylized' },
            { id: 'hst', label: 'Intercity 125' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setTrainModel(m.id)}
              className="rounded-full px-3 py-1 font-medium transition"
              style={
                trainModel === m.id
                  ? { background: brand.gold, color: '#000' }
                  : { color: 'rgba(255,255,255,0.7)' }
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/12 bg-black/50 px-3 py-2 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              autoRotate ? 'text-black' : 'text-white/70 hover:bg-white/10'
            }`}
            style={autoRotate ? { background: brand.gold } : undefined}
          >
            <Orbit size={13} /> Auto-rotate
          </button>
          <div className="h-4 w-px bg-white/15" />
          {trainModel === 'hst' ? (
            <span className="px-1 text-[11px] text-white/60">InterCity black &amp; gold livery</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {TRAIN_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTrainColor(c.value)}
                  aria-label={`Train colour ${c.id}`}
                  className={`h-5 w-5 rounded-full border-2 transition ${
                    trainColor === c.value ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Service punctuality — real On-Time / Delayed / Cancelled split */}
      <GlassCard className="animate-fade-up p-4 md:p-5">
        <SectionHeader
          icon={Activity}
          kicker="Network reliability"
          title="Service punctuality"
          right={
            <div className="flex items-center gap-4">
              {SERVICE.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs text-white/60">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  {s.key}
                </span>
              ))}
            </div>
          }
        />
        <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded-full">
          {SERVICE.map((s) => {
            const pct = ((svc[s.key] || 0) / svcTotal) * 100
            return (
              <div
                key={s.key}
                className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, background: s.color }}
                title={`${s.key}: ${pct.toFixed(1)}%`}
              />
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {SERVICE.map((s) => {
            const count = svc[s.key] || 0
            const pct = (count / svcTotal) * 100
            return (
              <div key={s.key} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                <div className="text-lg font-semibold tabular-nums" style={{ color: s.color }}>
                  {pct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-white/55">
                  {s.key} · {intComma(count)}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* Bottom three analytics panels */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Regional revenue — single-hue magnitude bar */}
        <GlassCard className="animate-fade-up p-4">
          <SectionHeader icon={MapPin} title="Regional revenue" kicker="By departure city" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={regional} layout="vertical" margin={{ top: 4, right: 52, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={chart.grid} horizontal={false} />
              <XAxis type="number" domain={[0, maxRegion * 1.12]} hide />
              <YAxis
                type="category"
                dataKey="region"
                width={78}
                tick={{ fill: ink.secondary, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={chart.cursor}
                contentStyle={chart.tooltip}
                formatter={(v) => [gbpFull(v), 'Revenue']}
              />
              <Bar dataKey="revenue" fill={brand.gold} radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList
                  dataKey="revenue"
                  position="right"
                  formatter={gbpCompact}
                  style={{ fill: ink.secondary, fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Seating classes */}
        <GlassCard className="animate-fade-up p-4">
          <SectionHeader icon={Armchair} title="Seating classes" kicker="Ticket-class split" />
          <div className="grid grid-cols-3 gap-2.5">
            {seating.map((s, i) => {
              const Icon = SEAT_ICONS[i] ?? Armchair
              return (
                <div key={s.label} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${SEAT_TINTS[i] ?? SEAT_TINTS[0]}`}>
                    <Icon size={30} className="text-white/85" />
                  </div>
                  <div className="p-2.5">
                    <div className="text-[11px] font-semibold leading-tight text-white">{s.label}</div>
                    <div className="mt-1.5 space-y-0.5 text-[10px] text-white/60">
                      <div>
                        Avg <span style={{ color: brand.gold }}>£{s.avgPrice}</span>
                      </div>
                      <div>{intComma(s.tickets)} tickets</div>
                      {/* First Class - Anytime is a subset of First Class, so its
                          share is quoted against that, not against all sales. */}
                      <div>{s.share}% of {s.shareOf ?? 'all sales'}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[10px] leading-snug text-white/40">
            Standard dominates at {seating[0].share}% of tickets; First-class fares average
            {' '}£{seating[1].avgPrice}–£{seating[2].avgPrice}.
          </p>
        </GlassCard>

        {/* Ticket sales trend — single-hue area, ~10% fill, monthly/weekly */}
        <GlassCard className="animate-fade-up p-4">
          <SectionHeader
            icon={Receipt}
            title="Ticket sales trend"
            kicker="Revenue over time"
            right={
              <SegToggle
                options={['monthly', 'weekly']}
                value={trendMode}
                onChange={setTrendMode}
              />
            }
          />
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trendData} margin={{ top: 18, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brand.gold} stopOpacity={chart.areaFillOpacity} />
                  <stop offset="100%" stopColor={brand.gold} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chart.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: ink.muted, fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickLine={false}
                interval={trendMode === 'weekly' ? 2 : 0}
              />
              <YAxis
                tickFormatter={gbpCompact}
                width={48}
                tick={{ fill: ink.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={chart.tooltip} formatter={(v) => [gbpFull(v), 'Revenue']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={brand.gold}
                strokeWidth={2}
                fill="url(#goldFill)"
                dot={{ fill: brand.gold, stroke: '#0a0d14', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: brand.gold, stroke: '#0a0d14', strokeWidth: 2 }}
              >
                {trendMode === 'monthly' && (
                  <LabelList
                    dataKey="revenue"
                    position="top"
                    formatter={gbpCompact}
                    style={{ fill: ink.secondary, fontSize: 10 }}
                  />
                )}
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </section>
    </div>
  )
}
