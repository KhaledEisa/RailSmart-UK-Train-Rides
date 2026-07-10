import { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import manager from '../data/manager.json'
import { C, intc, onTimeColor } from '../theme'
import { Card, StatCard, Pill, SectionHeader, HBar, Chip } from '../components/ui'

const SEV = { High: C.critical, Medium: C.warning, Low: C.neutral }
const FILTERS = ['All', 'In Service', 'Delayed', 'Maintenance']

export default function StationManagerScreen() {
  const [filter, setFilter] = useState('All')
  const { fleet, maintenance, delayReasons, delayWatch, statusSummary, delayByTimeOfDay } = manager
  const counts = fleet.reduce((a, t) => ((a[t.status] = (a[t.status] || 0) + 1), a), {})
  const onTimePct = (statusSummary.onTime / statusSummary.total) * 100
  const maxReason = Math.max(...delayReasons.map((r) => r.count))
  const maxBand = Math.max(...delayByTimeOfDay.map((d) => d.rate))

  const view = useMemo(
    () => (filter === 'All' ? fleet : fleet.filter((t) => t.status === filter)),
    [filter, fleet],
  )

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pill>Station Manager</Pill>
      <Text style={styles.title}>Operations console</Text>

      <View style={styles.kpiGrid}>
        <StatCard icon="train" accent={C.neutral} value={fleet.length} label="In roster" />
        <StatCard icon="checkmark-circle" accent={C.good} value={counts['In Service'] || 0} label="In service" />
        <StatCard icon="time" accent={C.warning} value={counts['Delayed'] || 0} label="Delayed" />
        <StatCard icon="construct" accent={C.critical} value={counts['Maintenance'] || 0} label="Maintenance" />
      </View>

      {/* Fleet */}
      <View style={{ marginTop: 16 }}>
        <SectionHeader icon="train" title="Fleet status" />
        <View style={styles.chips}>
          {FILTERS.map((f) => <Chip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />)}
        </View>
        <Card style={{ marginTop: 10, padding: 0, overflow: 'hidden' }}>
          {view.map((t, i) => (
            <View key={t.id} style={[styles.fleetRow, i > 0 && styles.divider]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.ink, fontWeight: '600', fontSize: 13 }}>{t.id}</Text>
                <Text style={{ color: C.ink45, fontSize: 11 }} numberOfLines={1}>{t.route}</Text>
              </View>
              <Text style={{ color: onTimeColor(t.onTime), fontSize: 13, width: 46, textAlign: 'right' }}>{t.onTime}%</Text>
              <View style={{ width: 96, alignItems: 'flex-end' }}>
                <Pill color={t.status === 'In Service' ? C.good : t.status === 'Delayed' ? C.warning : C.critical}>{t.status}</Pill>
              </View>
            </View>
          ))}
          {view.length === 0 && <Text style={{ color: C.ink45, textAlign: 'center', padding: 20 }}>No units match.</Text>}
        </Card>
      </View>

      {/* Maintenance */}
      <View style={{ marginTop: 16 }}>
        <SectionHeader icon="construct" title="Maintenance queue" />
        {maintenance.map((m) => (
          <Card key={m.id} style={{ marginBottom: 8 }}>
            <View style={styles.rowBetween}>
              <Text style={{ color: C.ink, fontWeight: '600' }}>{m.id}</Text>
              <Pill color={SEV[m.severity]}>{m.severity}</Pill>
            </View>
            <Text style={{ color: C.ink70, fontSize: 13, marginTop: 4 }}>{m.issue}</Text>
            <Text style={{ color: C.ink30, fontSize: 11 }}>{m.model}</Text>
          </Card>
        ))}
      </View>

      {/* Delay watch */}
      <View style={{ marginTop: 8 }}>
        <SectionHeader icon="warning" title="Delay watch" />
        {delayWatch.map((w) => (
          <Card key={w.route} style={{ marginBottom: 8 }}>
            <View style={styles.rowBetween}>
              <Text style={{ color: C.ink, fontSize: 13, flex: 1 }} numberOfLines={1}>{w.route}</Text>
              <Pill color={onTimeColor(w.onTime)}>{w.risk}</Pill>
            </View>
            <Text style={{ color: C.ink45, fontSize: 11, marginTop: 4 }}>
              {w.onTime}% on time ·{' '}
              {w.avgDelay == null ? 'cancellations only, no delays' : `avg delay ${w.avgDelay} min`}
            </Text>
          </Card>
        ))}
      </View>

      {/* Delay causes */}
      <Card style={{ marginTop: 8 }}>
        <SectionHeader icon="warning" title="Top delay & cancellation causes" />
        {delayReasons.map((r) => (
          <HBar key={r.reason} label={r.reason} value={r.count} max={maxReason} display={intc(r.count)} />
        ))}
      </Card>

      {/* Delay by time of day */}
      <Card style={{ marginTop: 12, marginBottom: 8 }}>
        <SectionHeader icon="speedometer" title="Delay rate by time of day" />
        {delayByTimeOfDay.map((d) => (
          <HBar key={d.band} label={d.band} value={d.rate} max={maxBand} display={`${d.rate}%`} color={d.rate > 8 ? C.critical : C.gold} />
        ))}
      </Card>

      <Text style={styles.footer}>On-time baseline: {onTimePct.toFixed(1)}% ({intc(statusSummary.onTime)} of {intc(statusSummary.total)} journeys). Fleet simulated from real route reliability.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  title: { color: C.ink, fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fleetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: { color: C.ink30, fontSize: 11, textAlign: 'center', marginTop: 12 },
})
