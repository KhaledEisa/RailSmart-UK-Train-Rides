import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import data from '../data/dashboard.json'
import { C, gbp, gbpc, intc } from '../theme'
import { Card, StatCard, SectionHeader, HBar } from '../components/ui'

const SERVICE = [
  { key: 'On Time', color: C.good },
  { key: 'Delayed', color: C.warning },
  { key: 'Cancelled', color: C.critical },
]

export default function DataEngineerScreen() {
  const [trendMode, setTrendMode] = useState('monthly')
  const { kpis, regional, seating, trend, status } = data
  const avgFare = kpis.ticketValue / kpis.passengers
  const svcTotal = SERVICE.reduce((a, s) => a + (status[s.key] || 0), 0)
  const maxRegion = Math.max(...regional.map((r) => r.revenue))
  const trendData = trend[trendMode]
  const maxTrend = Math.max(...trendData.map((t) => t.revenue))

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="train" size={26} color={C.gold} />
        </View>
        <Text style={styles.heroKicker}>UK RAIL INTELLIGENCE</Text>
        <Text style={styles.heroTitle}>Network overview</Text>
        <Text style={styles.heroSub}>31,653 journeys · Jan–Apr 2024 · every figure from the cleaned dataset</Text>
      </View>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <StatCard icon="people" value={intc(kpis.passengers)} label="Ticketed passengers" sub={`${data.routes} routes`} />
        <StatCard icon="train" accent={C.good} value={`${kpis.onTimeRate}%`} label="On-time performance" />
        <StatCard icon="receipt" value={gbpc(kpis.ticketValue)} label="Total ticket value" />
        <StatCard icon="cash" value={`£${avgFare.toFixed(2)}`} label="Average fare" />
      </View>

      {/* Service punctuality */}
      <Card style={{ marginTop: 12 }}>
        <SectionHeader icon="pulse" kicker="Network reliability" title="Service punctuality" />
        <View style={styles.svcBar}>
          {SERVICE.map((s) => (
            <View key={s.key} style={{ flex: (status[s.key] || 0) / svcTotal, backgroundColor: s.color, height: 14 }} />
          ))}
        </View>
        <View style={styles.svcLegend}>
          {SERVICE.map((s) => {
            const pct = ((status[s.key] || 0) / svcTotal) * 100
            return (
              <View key={s.key} style={styles.svcItem}>
                <Text style={[styles.svcPct, { color: s.color }]}>{pct.toFixed(1)}%</Text>
                <Text style={styles.svcLabel}>{s.key}</Text>
                <Text style={styles.svcCount}>{intc(status[s.key])}</Text>
              </View>
            )
          })}
        </View>
      </Card>

      {/* Regional revenue */}
      <Card style={{ marginTop: 12 }}>
        <SectionHeader icon="location" kicker="By departure city" title="Regional revenue" />
        {regional.map((r) => (
          <HBar key={r.region} label={r.region} value={r.revenue} max={maxRegion} display={gbpc(r.revenue)} />
        ))}
      </Card>

      {/* Seating classes */}
      <Card style={{ marginTop: 12 }}>
        <SectionHeader icon="albums" kicker="Ticket-class split" title="Seating classes" />
        {seating.map((s) => (
          <View key={s.label} style={styles.seatRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.seatName}>{s.label}</Text>
              <Text style={styles.seatSub}>{intc(s.tickets)} tickets · {s.share}% of {s.shareOf ?? 'all sales'}</Text>
            </View>
            <Text style={styles.seatPrice}>£{s.avgPrice}</Text>
          </View>
        ))}
      </Card>

      {/* Trend */}
      <Card style={{ marginTop: 12, marginBottom: 8 }}>
        <SectionHeader
          icon="trending-up"
          kicker="Revenue over time"
          title="Ticket sales trend"
          right={
            <View style={styles.seg}>
              {['monthly', 'weekly'].map((m) => (
                <Pressable key={m} onPress={() => setTrendMode(m)} style={[styles.segBtn, trendMode === m && { backgroundColor: C.gold }]}>
                  <Text style={{ color: trendMode === m ? '#000' : C.ink55, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{m}</Text>
                </Pressable>
              ))}
            </View>
          }
        />
        <View style={styles.columns}>
          {trendData.map((t) => (
            <View key={t.label} style={styles.col}>
              <View style={[styles.colFill, { height: Math.max(4, (t.revenue / maxTrend) * 120), backgroundColor: C.gold }]} />
              <Text style={styles.colLabel} numberOfLines={1}>{t.label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  hero: {
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.panelBorder,
    backgroundColor: 'rgba(197,168,128,0.06)',
  },
  heroIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(197,168,128,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroKicker: { color: C.ink30, fontSize: 10, letterSpacing: 3 },
  heroTitle: { color: C.ink, fontSize: 24, fontWeight: '800', marginTop: 2 },
  heroSub: { color: C.ink45, fontSize: 12, marginTop: 4 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  svcBar: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', gap: 2 },
  svcLegend: { flexDirection: 'row', gap: 10, marginTop: 10 },
  svcItem: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 8 },
  svcPct: { fontSize: 16, fontWeight: '700' },
  svcLabel: { color: C.ink55, fontSize: 11 },
  svcCount: { color: C.ink30, fontSize: 10 },
  seatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  seatName: { color: C.ink, fontSize: 13, fontWeight: '600' },
  seatSub: { color: C.ink45, fontSize: 11, marginTop: 1 },
  seatPrice: { color: C.gold, fontSize: 15, fontWeight: '700' },
  seg: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: 2 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  columns: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150, marginTop: 8, gap: 4 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  colFill: { width: '70%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  colLabel: { color: C.ink45, fontSize: 9, marginTop: 6 },
})
