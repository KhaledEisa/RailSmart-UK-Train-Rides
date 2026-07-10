// Local bookings store — persisted to localStorage, shared across the passenger
// site via useSyncExternalStore. No backend: bookings are a client-side demo of
// the full flow (book -> simulated payment -> manage). Client state per web §A4;
// a tiny hand-rolled store keeps it dependency-free.
import { useSyncExternalStore } from 'react'

const KEY = 'railsmart.bookings.v1'
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

let bookings = load()

function commit(next) {
  bookings = next
  try {
    localStorage.setItem(KEY, JSON.stringify(bookings))
  } catch {
    /* ignore quota/availability errors in this demo */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Reactive hook: re-renders on any booking change.
export function useBookings() {
  return useSyncExternalStore(subscribe, () => bookings)
}

// Human-friendly booking reference, e.g. "RS-7QX4K2".
export function makeBookingRef() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = ''
  for (let i = 0; i < 6; i++) ref += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `RS-${ref}`
}

export function addBooking(booking) {
  const record = {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `bk_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    ref: makeBookingRef(),
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
    ...booking,
  }
  commit([record, ...bookings])
  return record
}

export function cancelBooking(id) {
  commit(bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
}

export function activeCount() {
  return bookings.filter((b) => b.status === 'confirmed').length
}
