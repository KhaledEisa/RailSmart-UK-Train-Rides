import { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import passenger from '../data/passenger.json'
import { C, gbp, onTimeColor } from '../theme'
import { Card, Pill, SectionHeader } from '../components/ui'
import { useBookings } from '../store/bookings'
import BookingSheet from '../booking/BookingSheet'
import MyBookingsSheet from '../booking/MyBookingsSheet'

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toHHMM = (min) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}` }

export default function PassengerScreen() {
  const bookings = useBookings((s) => s.bookings)
  const activeCount = bookings.filter((b) => b.status === 'confirmed').length

  const origins = useMemo(
    () => passenger.stations.filter((s) => Object.values(passenger.routes).some((r) => r.from === s)),
    [],
  )
  const [from, setFrom] = useState(origins[0])
  const destinations = useMemo(
    () => Object.values(passenger.routes).filter((r) => r.from === from).map((r) => r.to),
    [from],
  )
  const [toSel, setToSel] = useState(null)
  const to = toSel && destinations.includes(toSel) ? toSel : destinations[0]
  const [railcard, setRailcard] = useState(false)
  const [picker, setPicker] = useState(null) // 'from' | 'to' | null
  const [booking, setBooking] = useState(null)
  const [showBookings, setShowBookings] = useState(false)

  const route = passenger.routes[`${from}->${to}`]
  const discount = railcard ? 1 - passenger.railcardDiscount : 1
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const otColor = route ? onTimeColor(route.onTimeRate) : C.neutral
  const upcoming = route
    ? [...route.departures]
        .map((d) => ({ dep: d, depMin: toMin(d) }))
        .sort((a, b) => ((a.depMin - nowMin + 1440) % 1440) - ((b.depMin - nowMin + 1440) % 1440))
        .slice(0, 5)
    : []

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Pill>Passenger</Pill>
            <Text style={styles.title}>Plan your journey</Text>
          </View>
          <Pressable style={styles.myBtn} onPress={() => setShowBookings(true)}>
            <Ionicons name="ticket" size={16} color={C.gold} />
            {activeCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{activeCount}</Text></View>
            )}
          </Pressable>
        </View>

        {/* planner */}
        <Card style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <StationField label="From" value={from} onPress={() => setPicker('from')} />
            <Ionicons name="arrow-forward" size={16} color={C.ink30} style={{ marginTop: 16 }} />
            <StationField label="To" value={to} onPress={() => setPicker('to')} />
          </View>
          <Pressable onPress={() => setRailcard((v) => !v)} style={[styles.railcard, railcard && { borderColor: C.gold, backgroundColor: 'rgba(197,168,128,0.12)' }]}>
            <Text style={{ color: C.ink70, fontSize: 13 }}>Railcard (⅓ off)</Text>
            <Text style={{ color: railcard ? C.gold : C.ink30, fontWeight: '700', fontSize: 12 }}>{railcard ? 'Applied' : 'Off'}</Text>
          </Pressable>

          {route && (
            <View style={styles.summary}>
              <Metric value={`${route.onTimeRate}%`} label="on-time" color={otColor} />
              <View style={styles.vsep} />
              <Metric value={`${route.avgDurationMin}m`} label="journey" />
              <View style={styles.vsep} />
              <Metric value={gbp(route.avgPrice * discount)} label="avg fare" color={C.gold} />
            </View>
          )}
        </Card>

        {/* departures */}
        {route && (
          <Card style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
            <View style={styles.depHead}>
              <Ionicons name="train" size={13} color={C.gold} />
              <Text style={styles.depHeadText}>LIVE DEPARTURES · {from.toUpperCase()}</Text>
              <Text style={styles.depClock}>{toHHMM(nowMin)}</Text>
            </View>
            {upcoming.map((u, i) => (
              <View key={u.dep} style={[styles.depRow, i === 0 && { backgroundColor: 'rgba(197,168,128,0.08)' }]}>
                <Text style={styles.depTime}>{u.dep}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.ink70, fontSize: 13 }} numberOfLines={1}>{to}</Text>
                  <Text style={{ color: C.ink45, fontSize: 11 }}>arr {toHHMM(u.depMin + route.avgDurationMin)} · {route.avgDurationMin} min</Text>
                </View>
                <Text style={styles.depPrice}>{gbp(route.avgPrice * discount)}</Text>
                <Pressable style={styles.bookBtn} onPress={() => setBooking({ from, to, route, departure: u.dep, railcard })}>
                  <Text style={styles.bookText}>Book</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        )}

        {/* offers */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader icon="pricetag" title="Top advance-booking offers" />
          {passenger.offers.map((o) => {
            const offerRoute = passenger.routes[`${o.from}->${o.to}`]
            return (
              <Pressable key={`${o.from}-${o.to}`} onPress={() => offerRoute && setBooking({ from: o.from, to: o.to, route: offerRoute, initialFare: 'Advance', railcard: false })}>
                <Card style={{ marginBottom: 10 }}>
                  <View style={styles.rowBetween}>
                    <Text style={{ color: C.ink, fontWeight: '600', flex: 1 }} numberOfLines={1}>{o.from} → {o.to}</Text>
                    <Ionicons name="arrow-forward" size={14} color={C.gold} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
                    <Text style={{ color: C.gold, fontSize: 20, fontWeight: '700' }}>{gbp(o.advance)}</Text>
                    <Text style={{ color: C.ink30, fontSize: 13, textDecorationLine: 'line-through' }}>{gbp(o.anytime)}</Text>
                  </View>
                  <Text style={{ color: C.good, fontSize: 12, marginTop: 3 }}>Save {gbp(o.saving)} ({o.pct}%) booking Advance</Text>
                </Card>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      <StationPicker
        visible={picker !== null}
        options={picker === 'from' ? origins : destinations}
        selected={picker === 'from' ? from : to}
        onSelect={(v) => { if (picker === 'from') { setFrom(v); setToSel(null) } else setToSel(v); setPicker(null) }}
        onClose={() => setPicker(null)}
      />
      {booking && <BookingSheet trip={booking} onClose={() => setBooking(null)} onManage={() => setShowBookings(true)} />}
      {showBookings && <MyBookingsSheet onClose={() => setShowBookings(false)} />}
    </View>
  )
}

function StationField({ label, value, onPress }) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <Text style={{ color: C.ink55, fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <View style={styles.field}>
        <Text style={{ color: C.ink, fontSize: 13, flex: 1 }} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color={C.ink45} />
      </View>
    </Pressable>
  )
}

function Metric({ value, label, color = C.ink }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color, fontSize: 15, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: C.ink45, fontSize: 11 }}>{label}</Text>
    </View>
  )
}

function StationPicker({ visible, options, selected, onSelect, onClose }) {
  if (!visible) return null
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.pickerSheet}>
          <View style={styles.head}>
            <Text style={styles.headTitle}>Choose station</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={C.ink55} /></Pressable>
          </View>
          <ScrollView>
            {options.map((s) => (
              <Pressable key={s} style={styles.pickRow} onPress={() => onSelect(s)}>
                <Text style={{ color: s === selected ? C.gold : C.ink, fontSize: 15 }}>{s}</Text>
                {s === selected && <Ionicons name="checkmark" size={18} color={C.gold} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: C.ink, fontSize: 24, fontWeight: '800', marginTop: 8 },
  myBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.panelBorder, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.05)' },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.panelBorder, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 10 },
  railcard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.panelBorder, borderRadius: 10, padding: 12, marginTop: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginTop: 12 },
  vsep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  depHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.panelBorder, backgroundColor: 'rgba(255,255,255,0.03)' },
  depHeadText: { color: C.ink45, fontSize: 10, letterSpacing: 1.5, flex: 1 },
  depClock: { color: C.ink45, fontSize: 11 },
  depRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  depTime: { color: C.gold, fontSize: 18, fontWeight: '800' },
  depPrice: { color: C.gold, fontSize: 13, fontWeight: '700' },
  bookBtn: { backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  bookText: { color: '#000', fontWeight: '700', fontSize: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: C.bg2, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.panelBorder, maxHeight: '80%' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  headTitle: { color: C.ink, fontSize: 15, fontWeight: '700' },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
})
