import { useMemo, useState } from 'react'
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, gbp } from '../theme'
import { useBookings } from '../store/bookings'

const RAILCARD = 0.3333
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toHHMM = (min) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}` }
const digits = (s) => s.replace(/\D/g, '')
const groups4 = (s) => digits(s).slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
function luhn(n) { const d = digits(n); if (d.length !== 16) return false; let s = 0; for (let i = 0; i < 16; i++) { let x = +d[15 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9 } s += x } return s % 10 === 0 }
function expOk(e) { const m = /^(\d{2})\/(\d{2})$/.exec(e); if (!m) return false; const mm = +m[1]; if (mm < 1 || mm > 12) return false; return new Date(2000 + +m[2], mm, 0, 23, 59) >= new Date() }
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function BookingSheet({ trip, onClose, onManage }) {
  const addBooking = useBookings((s) => s.addBooking)
  const { from, to, route } = trip
  const [step, setStep] = useState('review')
  const fareKeys = Object.keys(route.fares)
  const [fareType, setFareType] = useState(trip.initialFare && route.fares[trip.initialFare] ? trip.initialFare : fareKeys[0])
  const [departure, setDeparture] = useState(trip.departure || route.departures[0])
  const [pax, setPax] = useState(1)
  const [railcard, setRailcard] = useState(!!trip.railcard)
  const [record, setRecord] = useState(null)

  const unit = route.fares[fareType] * (railcard ? 1 - RAILCARD : 1)
  const total = unit * pax
  const arrival = toHHMM(toMin(departure) + route.avgDurationMin)

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.headTitle} numberOfLines={1}>
              {step === 'done' ? 'Booking confirmed' : `${from} → ${to}`}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={C.ink55} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {step === 'review' && (
              <Review {...{ route, fareType, setFareType, fareKeys, departure, setDeparture, arrival, pax, setPax, railcard, setRailcard, unit, total }} />
            )}
            {step === 'pay' && (
              <Pay total={total} onBack={() => setStep('review')} onPaid={(last4) => {
                const rec = addBooking({ from, to, date: todayISO(), departure, arrival, fareType, railcard, passengers: pax, total: +total.toFixed(2), paymentLast4: last4 })
                setRecord(rec)
                setStep('done')
              }} />
            )}
            {step === 'done' && record && <Done record={record} onClose={onClose} onManage={onManage} />}
          </ScrollView>

          {step === 'review' && (
            <Pressable style={styles.cta} onPress={() => setStep('pay')}>
              <Text style={styles.ctaText}>Continue to payment · {gbp(total)}</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  )
}

function Review({ route, fareType, setFareType, fareKeys, departure, setDeparture, arrival, pax, setPax, railcard, setRailcard, unit, total }) {
  const depIdx = route.departures.indexOf(departure)
  return (
    <View>
      <View style={styles.timeRow}>
        <View>
          <Text style={styles.bigTime}>{departure}</Text>
          <Text style={styles.tiny}>depart</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={C.ink30} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.bigTime}>{arrival}</Text>
          <Text style={styles.tiny}>arrive · {route.avgDurationMin} min</Text>
        </View>
      </View>

      {route.departures.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <Pressable style={styles.stepBtn} onPress={() => setDeparture(route.departures[(depIdx - 1 + route.departures.length) % route.departures.length])}>
            <Ionicons name="chevron-back" size={16} color={C.ink70} />
          </Pressable>
          <Text style={{ color: C.ink55, alignSelf: 'center', flex: 1, textAlign: 'center' }}>Departure {depIdx + 1} of {route.departures.length}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setDeparture(route.departures[(depIdx + 1) % route.departures.length])}>
            <Ionicons name="chevron-forward" size={16} color={C.ink70} />
          </Pressable>
        </View>
      )}

      <Text style={styles.label}>Ticket type</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {fareKeys.map((k) => (
          <Pressable key={k} onPress={() => setFareType(k)} style={[styles.fare, fareType === k && { borderColor: C.gold, backgroundColor: 'rgba(197,168,128,0.12)' }]}>
            <Text style={styles.fareType}>{k}</Text>
            <Text style={styles.farePrice}>{gbp(route.fares[k])}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.paxRow}>
        <Text style={styles.label}>Passengers</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable style={styles.round} onPress={() => setPax((p) => Math.max(1, p - 1))}><Ionicons name="remove" size={16} color={C.ink70} /></Pressable>
          <Text style={{ color: C.ink, fontSize: 16, fontWeight: '700', width: 20, textAlign: 'center' }}>{pax}</Text>
          <Pressable style={styles.round} onPress={() => setPax((p) => Math.min(6, p + 1))}><Ionicons name="add" size={16} color={C.ink70} /></Pressable>
        </View>
      </View>

      <Pressable onPress={() => setRailcard((v) => !v)} style={[styles.railcard, railcard && { borderColor: C.gold, backgroundColor: 'rgba(197,168,128,0.1)' }]}>
        <Text style={{ color: C.ink70 }}>Railcard (⅓ off)</Text>
        <Text style={{ color: railcard ? C.gold : C.ink30, fontWeight: '700', fontSize: 12 }}>{railcard ? 'Applied' : 'Tap to apply'}</Text>
      </Pressable>

      <View style={styles.totalBox}>
        <View style={styles.totalRow}>
          <Text style={{ color: C.ink55 }}>{gbp(unit)} × {pax}</Text>
          <Text style={{ color: C.ink }}>{gbp(unit * pax)}</Text>
        </View>
        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 8 }]}>
          <Text style={{ color: C.ink, fontWeight: '700', fontSize: 16 }}>Total</Text>
          <Text style={{ color: C.gold, fontWeight: '700', fontSize: 16 }}>{gbp(total)}</Text>
        </View>
      </View>
    </View>
  )
}

function Pay({ total, onBack, onPaid }) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const errors = useMemo(() => {
    const e = {}
    if (!name.trim()) e.name = 'Enter the name on the card'
    if (!luhn(number)) e.number = 'Enter a valid 16-digit card'
    if (!expOk(expiry)) e.expiry = 'Valid future expiry (MM/YY)'
    if (digits(cvc).length !== 3) e.cvc = '3-digit CVC'
    return e
  }, [name, number, expiry, cvc])

  const pay = () => {
    setTouched(true)
    if (Object.keys(errors).length || busy) return
    setBusy(true)
    setTimeout(() => onPaid(digits(number).slice(-4)), 1600)
  }
  const err = (k) => (touched && errors[k] ? <Text style={styles.err}>{errors[k]}</Text> : null)

  return (
    <View>
      <View style={styles.demo}>
        <Ionicons name="lock-closed" size={12} color={C.good} />
        <Text style={styles.demoText}>Demo checkout — no real card is charged. Try 4242 4242 4242 4242.</Text>
      </View>

      <Text style={styles.label}>Name on card</Text>
      <TextInput value={name} onChangeText={setName} placeholder="A. Passenger" placeholderTextColor={C.ink30} style={styles.input} />
      {err('name')}

      <Text style={[styles.label, { marginTop: 10 }]}>Card number</Text>
      <TextInput value={number} onChangeText={(t) => setNumber(groups4(t))} keyboardType="number-pad" placeholder="4242 4242 4242 4242" placeholderTextColor={C.ink30} style={styles.input} />
      {err('number')}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Expiry</Text>
          <TextInput value={expiry} onChangeText={(t) => { const d = digits(t).slice(0, 4); setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d) }} keyboardType="number-pad" placeholder="MM/YY" placeholderTextColor={C.ink30} style={styles.input} />
          {err('expiry')}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>CVC</Text>
          <TextInput value={cvc} onChangeText={(t) => setCvc(digits(t).slice(0, 3))} keyboardType="number-pad" placeholder="123" placeholderTextColor={C.ink30} style={styles.input} />
          {err('cvc')}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable style={styles.backBtn} onPress={onBack} disabled={busy}><Text style={{ color: C.ink70, fontWeight: '600' }}>Back</Text></Pressable>
        <Pressable style={[styles.cta, { flex: 1, marginTop: 0 }]} onPress={pay} disabled={busy}>
          {busy ? <ActivityIndicator color="#000" /> : <><Ionicons name="lock-closed" size={15} color="#000" /><Text style={styles.ctaText}>Pay {gbp(total)}</Text></>}
        </Pressable>
      </View>
    </View>
  )
}

function Done({ record, onClose, onManage }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <View style={styles.tick}><Ionicons name="checkmark-circle" size={34} color={C.good} /></View>
      <Text style={{ color: C.ink, fontSize: 18, fontWeight: '700', marginTop: 8 }}>You're booked!</Text>
      <Text style={{ color: C.ink55, marginTop: 4 }}>Reference <Text style={{ color: C.gold, fontWeight: '700' }}>{record.ref}</Text></Text>
      <View style={styles.doneCard}>
        <Text style={{ color: C.ink, fontWeight: '600' }}>{record.from} → {record.to}</Text>
        <Text style={{ color: C.ink55, fontSize: 12, marginTop: 3 }}>{record.date} · {record.departure} → {record.arrival} · {record.fareType}</Text>
        <Text style={{ color: C.ink55, fontSize: 12, marginTop: 2 }}>{record.passengers} pax · paid <Text style={{ color: C.gold }}>{gbp(record.total)}</Text> · card ····{record.paymentLast4}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
        <Pressable style={styles.backBtn} onPress={onClose}><Text style={{ color: C.ink70, fontWeight: '600' }}>Done</Text></Pressable>
        <Pressable style={[styles.cta, { flex: 1, marginTop: 0 }]} onPress={() => { onClose(); onManage?.() }}><Text style={styles.ctaText}>My bookings</Text></Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg2, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.panelBorder, maxHeight: '92%' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  headTitle: { color: C.ink, fontSize: 15, fontWeight: '700', flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 14 },
  bigTime: { color: C.ink, fontSize: 20, fontWeight: '700' },
  tiny: { color: C.ink45, fontSize: 11 },
  label: { color: C.ink55, fontSize: 12, marginBottom: 6 },
  fare: { flex: 1, borderWidth: 1, borderColor: C.panelBorder, borderRadius: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  fareType: { color: C.ink55, fontSize: 11 },
  farePrice: { color: C.ink, fontSize: 14, fontWeight: '700' },
  stepBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: C.panelBorder, alignItems: 'center', justifyContent: 'center' },
  paxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  round: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.panelBorder, alignItems: 'center', justifyContent: 'center' },
  railcard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.panelBorder, borderRadius: 10, padding: 12, marginBottom: 14, backgroundColor: 'rgba(0,0,0,0.3)' },
  totalBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gold, margin: 16, marginTop: 4, borderRadius: 12, paddingVertical: 14 },
  ctaText: { color: '#000', fontWeight: '700', fontSize: 14 },
  backBtn: { borderWidth: 1, borderColor: C.panelBorder, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, marginBottom: 12 },
  demoText: { color: C.ink55, fontSize: 11, flex: 1 },
  input: { borderWidth: 1, borderColor: C.panelBorder, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)', color: C.ink, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  err: { color: C.critical, fontSize: 11, marginTop: 3 },
  tick: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(52,211,153,0.13)', alignItems: 'center', justifyContent: 'center' },
  doneCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginTop: 14 },
})
