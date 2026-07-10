import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, gbp } from '../theme'
import { useBookings } from '../store/bookings'
import { Pill } from '../components/ui'

export default function MyBookingsSheet({ onClose }) {
  const bookings = useBookings((s) => s.bookings)
  const cancelBooking = useBookings((s) => s.cancelBooking)

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="ticket" size={18} color={C.gold} />
              <Text style={styles.headTitle}>My bookings</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={C.ink55} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {bookings.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Ionicons name="ticket-outline" size={34} color={C.ink30} />
                <Text style={{ color: C.ink45, marginTop: 10 }}>No bookings yet.</Text>
                <Text style={{ color: C.ink30, fontSize: 12, marginTop: 3 }}>Book a departure or an offer.</Text>
              </View>
            ) : (
              bookings.map((b) => {
                const cancelled = b.status === 'cancelled'
                return (
                  <View key={b.id} style={[styles.card, cancelled && { opacity: 0.55 }]}>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: C.ink, fontWeight: '600' }} numberOfLines={1}>{b.from} → {b.to}</Text>
                      <Pill color={cancelled ? C.neutral : C.good}>{cancelled ? 'Cancelled' : 'Confirmed'}</Pill>
                    </View>
                    <Text style={{ color: C.ink55, fontSize: 12, marginTop: 4 }}>{b.date} · {b.departure} → {b.arrival} · {b.fareType} · {b.passengers} pax</Text>
                    <View style={[styles.rowBetween, { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 8 }]}>
                      <Text style={{ color: C.ink30, fontSize: 11 }}>Ref {b.ref} · card ····{b.paymentLast4}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: C.gold, fontWeight: '700' }}>{gbp(b.total)}</Text>
                        {!cancelled && (
                          <Pressable onPress={() => cancelBooking(b.id)} style={styles.cancel}>
                            <Ionicons name="trash-outline" size={12} color={C.ink55} />
                            <Text style={{ color: C.ink55, fontSize: 11 }}>Cancel</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                    {cancelled && <Text style={{ color: C.good, fontSize: 11, marginTop: 6 }}>Refund of {gbp(b.total)} issued (demo).</Text>}
                  </View>
                )
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg2, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.panelBorder, maxHeight: '92%' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  headTitle: { color: C.ink, fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.panelBorder, borderRadius: 14, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancel: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.panelBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
})
