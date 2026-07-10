import { useEffect, useMemo, useState } from 'react'
import {
  X,
  ArrowRight,
  CreditCard,
  Lock,
  CheckCircle2,
  Minus,
  Plus,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react'
import { brand, status } from '../lib/theme.js'
import { gbpFull } from '../lib/data.js'
import { addBooking } from '../lib/bookings.js'

const RAILCARD_DISCOUNT = 0.3333

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toHHMM = (min) => {
  const x = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}
const todayISO = () => new Date().toISOString().slice(0, 10)

// ── card helpers ─────────────────────────────────────────────
const onlyDigits = (s) => s.replace(/\D/g, '')
const groups4 = (s) => onlyDigits(s).slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
function luhnOk(num) {
  const d = onlyDigits(num)
  if (d.length !== 16) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}
function expiryOk(exp) {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp)
  if (!m) return false
  const mm = Number(m[1])
  const yy = Number(m[2]) + 2000
  if (mm < 1 || mm > 12) return false
  const end = new Date(yy, mm, 0, 23, 59, 59)
  return end >= new Date()
}

export default function BookingModal({ trip, onClose, onManage }) {
  const { from, to, route } = trip
  const [step, setStep] = useState('review') // review | pay | done
  const [fareType, setFareType] = useState(
    trip.initialFare && route.fares[trip.initialFare] ? trip.initialFare : Object.keys(route.fares)[0],
  )
  const [date, setDate] = useState(todayISO())
  const [departure, setDeparture] = useState(trip.departure || route.departures[0])
  const [pax, setPax] = useState(1)
  const [railcard, setRailcard] = useState(Boolean(trip.railcard))
  const [record, setRecord] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const unit = route.fares[fareType] * (railcard ? 1 - RAILCARD_DISCOUNT : 1)
  const total = unit * pax
  const arrival = toHHMM(toMin(departure) + route.avgDurationMin)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/12 bg-[#0a0d14] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {step === 'done' ? (
              <>
                <CheckCircle2 size={16} style={{ color: status.good }} /> Booking confirmed
              </>
            ) : (
              <>
                <span className="truncate">{from}</span>
                <ArrowRight size={13} className="shrink-0 text-white/40" />
                <span className="truncate">{to}</span>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {step === 'review' && (
            <ReviewStep
              {...{ route, fareType, setFareType, date, setDate, departure, setDeparture, arrival, pax, setPax, railcard, setRailcard, unit, total }}
            />
          )}
          {step === 'pay' && (
            <PayStep
              total={total}
              onBack={() => setStep('review')}
              onPaid={(last4) => {
                const rec = addBooking({
                  from, to, date, departure, arrival,
                  durationMin: route.avgDurationMin,
                  fareType, railcard, passengers: pax,
                  unitPrice: Number(unit.toFixed(2)),
                  total: Number(total.toFixed(2)),
                  onTimeRate: route.onTimeRate,
                  paymentLast4: last4,
                })
                setRecord(rec)
                setStep('done')
              }}
            />
          )}
          {step === 'done' && record && (
            <DoneStep record={record} onClose={onClose} onManage={onManage} />
          )}
        </div>

        {step === 'review' && (
          <div className="border-t border-white/10 px-5 py-3.5">
            <button
              type="button"
              onClick={() => setStep('pay')}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-105"
              style={{ background: brand.gold }}
            >
              Continue to payment · {gbpFull(total)}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-white/55">{label}</label>
      {children}
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-1 text-[11px]" style={{ color: status.critical }}>
      {msg}
    </p>
  )
}

function ReviewStep({ route, fareType, setFareType, date, setDate, departure, setDeparture, arrival, pax, setPax, railcard, setRailcard, unit, total }) {
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Row label="Travel date">
          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-black/40 py-2 pl-9 pr-2 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        </Row>
        <Row label="Departure">
          <div className="relative">
            <Clock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <select
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-black/40 py-2 pl-9 pr-2 text-sm text-white outline-none focus:border-white/30"
            >
              {route.departures.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </Row>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm">
        <div>
          <div className="text-lg font-semibold tabular-nums">{departure}</div>
          <div className="text-[11px] text-white/45">depart</div>
        </div>
        <ArrowRight size={16} className="text-white/30" />
        <div className="text-right">
          <div className="text-lg font-semibold tabular-nums">{arrival}</div>
          <div className="text-[11px] text-white/45">arrive · {route.avgDurationMin} min</div>
        </div>
      </div>

      <Row label="Ticket type">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(route.fares).map(([type, price]) => {
            const active = type === fareType
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFareType(type)}
                className="rounded-lg border px-2 py-2 text-left transition"
                style={
                  active
                    ? { borderColor: brand.gold, background: `${brand.gold}1a` }
                    : { borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)' }
                }
              >
                <div className="text-[11px] text-white/60">{type}</div>
                <div className="text-sm font-semibold tabular-nums">{gbpFull(price)}</div>
              </button>
            )
          })}
        </div>
      </Row>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-white/55">Passengers</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPax((p) => Math.max(1, p - 1))} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10">
            <Minus size={13} />
          </button>
          <span className="w-5 text-center text-sm font-semibold tabular-nums">{pax}</span>
          <button type="button" onClick={() => setPax((p) => Math.min(6, p + 1))} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10">
            <Plus size={13} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRailcard((v) => !v)}
        className="mb-4 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition"
        style={
          railcard
            ? { borderColor: `${brand.gold}88`, background: `${brand.gold}14` }
            : { borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)' }
        }
      >
        <span className="text-white/80">Railcard (⅓ off)</span>
        <span className="text-xs font-semibold" style={{ color: railcard ? brand.gold : 'rgba(255,255,255,0.4)' }}>
          {railcard ? 'Applied' : 'Tap to apply'}
        </span>
      </button>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
        <div className="flex justify-between text-white/60">
          <span>{gbpFull(unit)} × {pax} {pax > 1 ? 'passengers' : 'passenger'}</span>
          <span className="tabular-nums">{gbpFull(unit * pax)}</span>
        </div>
        {railcard && (
          <div className="mt-1 flex justify-between text-[11px]" style={{ color: status.good }}>
            <span>Railcard discount applied</span>
            <span>−⅓</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums" style={{ color: brand.gold }}>{gbpFull(total)}</span>
        </div>
      </div>
    </div>
  )
}

function PayStep({ total, onBack, onPaid }) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [touched, setTouched] = useState(false)
  const [processing, setProcessing] = useState(false)

  const errors = useMemo(() => {
    const e = {}
    if (!name.trim()) e.name = 'Enter the name on the card'
    if (!luhnOk(number)) e.number = 'Enter a valid 16-digit card number'
    if (!expiryOk(expiry)) e.expiry = 'Enter a valid future expiry (MM/YY)'
    if (onlyDigits(cvc).length !== 3) e.cvc = '3-digit CVC'
    return e
  }, [name, number, expiry, cvc])
  const valid = Object.keys(errors).length === 0

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || processing) return
    setProcessing(true)
    // simulate a payment gateway round-trip
    setTimeout(() => onPaid(onlyDigits(number).slice(-4)), 1600)
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
        <Lock size={12} style={{ color: status.good }} />
        Demo checkout — no real card is charged. Try 4242 4242 4242 4242.
      </div>

      <Row label="Name on card">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="A. Passenger"
          className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
        />
        <FieldError msg={touched && errors.name} />
      </Row>

      <Row label="Card number">
        <div className="relative">
          <CreditCard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(groups4(e.target.value))}
            placeholder="4242 4242 4242 4242"
            className="w-full rounded-lg border border-white/12 bg-black/40 py-2 pl-9 pr-3 text-sm tabular-nums text-white outline-none focus:border-white/30"
          />
        </div>
        <FieldError msg={touched && errors.number} />
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="Expiry">
          <input
            inputMode="numeric"
            value={expiry}
            onChange={(e) => {
              const d = onlyDigits(e.target.value).slice(0, 4)
              setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
            }}
            placeholder="MM/YY"
            className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm tabular-nums text-white outline-none focus:border-white/30"
          />
          <FieldError msg={touched && errors.expiry} />
        </Row>
        <Row label="CVC">
          <input
            inputMode="numeric"
            value={cvc}
            onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 3))}
            placeholder="123"
            className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm tabular-nums text-white outline-none focus:border-white/30"
          />
          <FieldError msg={touched && errors.cvc} />
        </Row>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onBack} disabled={processing} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 disabled:opacity-50">
          Back
        </button>
        <button
          type="submit"
          disabled={processing}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-70"
          style={{ background: brand.gold }}
        >
          {processing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing…
            </>
          ) : (
            <>
              <Lock size={15} /> Pay {gbpFull(total)}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function DoneStep({ record, onClose, onManage }) {
  return (
    <div className="py-2 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full" style={{ background: `${status.good}22` }}>
        <CheckCircle2 size={30} style={{ color: status.good }} />
      </div>
      <div className="text-lg font-semibold">You're booked!</div>
      <div className="mt-1 text-sm text-white/55">
        Booking reference <span className="font-semibold tabular-nums" style={{ color: brand.gold }}>{record.ref}</span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm">
        <div className="flex items-center gap-2 font-medium">
          <span>{record.from}</span>
          <ArrowRight size={13} className="text-white/40" />
          <span>{record.to}</span>
        </div>
        <div className="mt-1 text-[12px] text-white/55">
          {record.date} · {record.departure} → {record.arrival} · {record.fareType}
        </div>
        <div className="mt-1 text-[12px] text-white/55">
          {record.passengers} {record.passengers > 1 ? 'passengers' : 'passenger'} · paid{' '}
          <span style={{ color: brand.gold }}>{gbpFull(record.total)}</span> · card ····{record.paymentLast4}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/75 hover:bg-white/5">
          Done
        </button>
        <button
          type="button"
          onClick={() => { onClose(); onManage?.() }}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-black hover:brightness-105"
          style={{ background: brand.gold }}
        >
          My bookings
        </button>
      </div>
    </div>
  )
}
