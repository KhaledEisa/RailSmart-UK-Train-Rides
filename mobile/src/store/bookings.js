// Bookings store — Zustand (mobile skill §2 default) persisted to AsyncStorage
// (skill §4: local storage is the source of truth). No backend; this is the
// same demo booking model as the web app.
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

function makeRef() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = ''
  for (let i = 0; i < 6; i++) ref += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `RS-${ref}`
}

export const useBookings = create(
  persist(
    (set) => ({
      bookings: [],
      addBooking: (b) => {
        const record = {
          id: `bk_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ref: makeRef(),
          status: 'confirmed',
          bookedAt: new Date().toISOString(),
          ...b,
        }
        set((s) => ({ bookings: [record, ...s.bookings] }))
        return record
      },
      cancelBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)),
        })),
    }),
    {
      name: 'railsmart-bookings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
