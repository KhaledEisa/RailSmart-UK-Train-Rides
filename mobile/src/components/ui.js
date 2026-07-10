import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C } from '../theme'

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function StatCard({ icon, value, label, sub, accent = C.gold }) {
  return (
    <Card style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={styles.statSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </Card>
  )
}

export function Pill({ color = C.gold, children, dot }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '22' }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  )
}

export function SectionHeader({ icon, title, kicker, right }) {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        {icon ? <Ionicons name={icon} size={18} color={C.gold} /> : null}
        <View>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      {right}
    </View>
  )
}

// Horizontal magnitude bar (label · track · value).
export function HBar({ label, value, max, display, color = C.gold }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <View style={styles.hbarRow}>
      <Text style={styles.hbarLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.hbarTrack}>
        <View style={[styles.hbarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.hbarValue}>{display}</Text>
    </View>
  )
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? { backgroundColor: C.gold } : { backgroundColor: 'rgba(255,255,255,0.06)' }]}
    >
      <Text style={[styles.chipText, { color: active ? '#000' : C.ink70 }]}>{label}</Text>
    </Pressable>
  )
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.panelBorder,
    borderRadius: 16,
    padding: 14,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: C.ink, fontSize: 20, fontWeight: '700' },
  statLabel: { color: C.ink55, fontSize: 12, marginTop: 2 },
  statSub: { color: C.ink30, fontSize: 11, marginTop: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  kicker: { color: C.ink30, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' },
  sectionTitle: { color: C.ink, fontSize: 15, fontWeight: '700' },
  hbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  hbarLabel: { color: C.ink70, fontSize: 12, width: 78 },
  hbarTrack: { flex: 1, height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  hbarFill: { height: '100%', borderRadius: 6 },
  hbarValue: { color: C.ink70, fontSize: 11, width: 54, textAlign: 'right' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600' },
})
