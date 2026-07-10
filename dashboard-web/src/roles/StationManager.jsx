import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ZAxis,
} from 'recharts'
import {
  Train,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  ArrowUpDown,
  Route as RouteIcon,
} from 'lucide-react'
import { useJson, intComma } from '../lib/data.js'
import { brand, status, chart, ink, onTimeColor } from '../lib/theme.js'
import {
  StatCard,
  GlassCard,
  Badge,
  SectionHeader,
  PageHeader,
  LoadingState,
} from '../components/ui.jsx'

const STATUS_META = {
  'In Service': { color: status.good, icon: CheckCircle2 },
  Delayed: { color: status.warning, icon: Clock },
  Maintenance: { color: status.critical, icon: Wrench },
}
const SEV = { High: status.critical, Medium: status.warning, Low: status.neutral }

const FILTERS = ['All', 'In Service', 'Delayed', 'Maintenance']

export default function StationManager() {
  const { data } = useJson('data/manager_data.json')
  const [filter, setFilter] = useState('All')
  const [sortKey, setSortKey] = useState('onTime')
  const [sortDir, setSortDir] = useState('asc')

  const fleetView = useMemo(() => {
    if (!data) return []
    let rows = data.fleet
    if (filter !== 'All') rows = rows.filter((t) => t.status === filter)
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sortKey === 'onTime') return (a.onTime - b.onTime) * dir
      if (sortKey === 'capacity') return (a.capacity - b.capacity) * dir
      return String(a.id).localeCompare(String(b.id)) * dir
    })
  }, [data, filter, sortKey, sortDir])

  if (!data) return <LoadingState label="Loading operations data…" />

  const { maintenance, delayReasons, delayWatch, statusSummary, delayByTimeOfDay, routeReliability } = data
  const counts = data.fleet.reduce((a, t) => ((a[t.status] = (a[t.status] || 0) + 1), a), {})
  const onTimePct = (statusSummary.onTime / statusSummary.total) * 100
  const reasonData = delayReasons.slice(0, 6)
  const maxReason = Math.max(...reasonData.map((r) => r.count))
  const scatter = routeReliability.map((r) => ({
    x: r.journeys,
    y: r.onTime,
    route: `${r.from} → ${r.to}`,
    avgDelay: r.avgDelay,
  }))

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        badge="Station Manager"
        title="Operations console"
        subtitle="Fleet status, maintenance and delay watch — grounded in the dataset's real punctuality."
      />

      {/* Stat cards */}
      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Train} accent={status.neutral} value={data.fleet.length} label="Train sets in roster" />
        <StatCard icon={CheckCircle2} accent={status.good} value={counts['In Service'] || 0} label="In service" />
        <StatCard icon={Clock} accent={status.warning} value={counts['Delayed'] || 0} label="Delayed" />
        <StatCard icon={Wrench} accent={status.critical} value={counts['Maintenance'] || 0} label="In maintenance" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fleet roster — filterable + sortable */}
        <div className="lg:col-span-2">
          <SectionHeader
            icon={Train}
            title="Fleet status"
            right={
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((f) => {
                  const active = f === filter
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                      style={
                        active
                          ? { background: brand.gold, color: '#000' }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }
                      }
                    >
                      {f}
                    </button>
                  )
                })}
              </div>
            }
          />
          <GlassCard className="overflow-hidden">
            <div className="grid grid-cols-[1.1fr_1.4fr_0.8fr_0.8fr] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-wide text-white/45">
              <button type="button" onClick={() => toggleSort('id')} className="flex items-center gap-1 text-left hover:text-white/70">
                Unit <ArrowUpDown size={11} className={sortKey === 'id' ? 'opacity-100' : 'opacity-30'} />
              </button>
              <span>Route</span>
              <button type="button" onClick={() => toggleSort('onTime')} className="flex items-center gap-1 text-left hover:text-white/70">
                On-time <ArrowUpDown size={11} className={sortKey === 'onTime' ? 'opacity-100' : 'opacity-30'} />
              </button>
              <span>Status</span>
            </div>
            <div className="max-h-[440px] divide-y divide-white/5 overflow-y-auto">
              {fleetView.map((t) => {
                const s = STATUS_META[t.status] || STATUS_META['In Service']
                const Icon = s.icon
                return (
                  <div key={t.id} className="grid grid-cols-[1.1fr_1.4fr_0.8fr_0.8fr] items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-white/[0.03]">
                    <div>
                      <div className="font-medium">{t.id}</div>
                      <div className="text-[11px] text-white/45">{t.model}</div>
                    </div>
                    <div className="truncate text-white/75" title={t.route}>
                      {t.route}
                      <span className="ml-2 text-[11px] text-white/40">dep {t.nextDeparture}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums" style={{ color: onTimeColor(t.onTime) }}>
                        {t.onTime}%
                      </span>
                    </div>
                    <div>
                      <Badge color={s.color}>
                        <Icon size={11} /> {t.status}
                      </Badge>
                      {t.issue && <div className="mt-0.5 text-[10px] text-white/40">{t.issue}</div>}
                    </div>
                  </div>
                )
              })}
              {fleetView.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-white/40">No units match this filter.</div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Maintenance + delay watch */}
        <div className="space-y-6">
          <div>
            <SectionHeader icon={Wrench} title="Maintenance queue" />
            <div className="space-y-2">
              {maintenance.map((m) => (
                <GlassCard key={m.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.id}</span>
                    <Badge color={SEV[m.severity]}>{m.severity}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-white/70">{m.issue}</div>
                  <div className="text-[11px] text-white/40">{m.model}</div>
                </GlassCard>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={AlertTriangle} title="Delay watch" />
            <div className="space-y-2">
              {delayWatch.map((w) => (
                <GlassCard key={w.route} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm" title={w.route}>{w.route}</span>
                    <Badge color={onTimeColor(w.onTime)}>{w.risk}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    {w.onTime}% on time ·{' '}
                    {w.avgDelay == null
                      ? 'cancellations only, no delays recorded'
                      : `avg delay ${w.avgDelay} min`}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Route reliability scatter — the full routeReliability set, surfaced */}
      <div className="mt-8">
        <SectionHeader
          icon={RouteIcon}
          title="Route reliability vs volume"
          kicker={`${routeReliability.length} routes`}
          right={
            <div className="flex items-center gap-3 text-[11px] text-white/55">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: status.good }} />≥90%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: status.warning }} />75–90%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: status.critical }} />&lt;75%</span>
            </div>
          }
        />
        <GlassCard className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 16 }}>
              <CartesianGrid stroke={chart.grid} />
              <XAxis
                type="number"
                dataKey="x"
                name="Journeys"
                scale="log"
                domain={['auto', 'auto']}
                tick={{ fill: ink.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Journeys (log scale)', position: 'insideBottom', offset: -8, fill: ink.muted, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="On-time"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: ink.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="number" range={[60, 60]} />
              <ReferenceLine
                y={onTimePct}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="4 4"
                label={{ value: `network ${onTimePct.toFixed(1)}%`, fill: ink.muted, fontSize: 10, position: 'insideTopRight' }}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                contentStyle={chart.tooltip}
                formatter={(value, name) => {
                  if (name === 'On-time') return [`${value}%`, 'on time']
                  if (name === 'Journeys') return [intComma(value), 'journeys']
                  return [value, name]
                }}
                labelFormatter={() => ''}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload
                  return (
                    <div style={chart.tooltip}>
                      <div className="font-medium text-white">{p.route}</div>
                      <div className="text-white/70">{intComma(p.x)} journeys · {p.y}% on time</div>
                      {/* null means the route records cancellations but never a delay */}
                      <div className="text-white/50">
                        {p.avgDelay == null
                          ? 'no delays recorded — disruption here is cancellations'
                          : `avg delay ${p.avgDelay} min`}
                      </div>
                    </div>
                  )
                }}
              />
              <Scatter data={scatter}>
                {scatter.map((d, i) => (
                  <Cell key={i} fill={onTimeColor(d.y)} fillOpacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="mt-1 text-[11px] text-white/40">
            Each dot is a route: right = higher volume, up = more punctual. The busy
            Liverpool↔London and Manchester↔London corridors sit well below the network line.
          </p>
        </GlassCard>
      </div>

      {/* Delay analytics */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-4">
          <SectionHeader icon={AlertTriangle} title="Top delay & cancellation causes" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reasonData} layout="vertical" margin={{ left: 4, right: 44 }}>
              <CartesianGrid stroke={chart.grid} horizontal={false} />
              <XAxis type="number" hide domain={[0, maxReason * 1.12]} />
              <YAxis
                type="category"
                dataKey="reason"
                width={120}
                tick={{ fill: ink.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={chart.cursor} contentStyle={chart.tooltip} formatter={(v) => [intComma(v), 'incidents']} />
              <Bar dataKey="count" fill={brand.gold} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader icon={Gauge} title="Delay rate by time of day" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={delayByTimeOfDay} margin={{ top: 8, left: -10, right: 8 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="band"
                tick={{ fill: ink.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: ink.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={chart.cursor} contentStyle={chart.tooltip} formatter={(v) => [`${v}%`, 'delay rate']} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={42}>
                {delayByTimeOfDay.map((d, i) => (
                  <Cell key={i} fill={d.rate > 8 ? status.critical : brand.gold} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <p className="mt-6 text-center text-xs text-white/35">
        On-time baseline across the network: {onTimePct.toFixed(1)}% ({intComma(statusSummary.onTime)} of{' '}
        {intComma(statusSummary.total)} journeys). Fleet roster simulated from real route reliability.
      </p>
    </div>
  )
}
