import { useEffect } from 'react'
import { X, ArrowRight, Ticket, Calendar, Clock, Trash2 } from 'lucide-react'
import { brand, status } from '../lib/theme.js'
import { gbpFull } from '../lib/data.js'
import { useBookings, cancelBooking } from '../lib/bookings.js'
import { Badge } from './ui.jsx'

export default function MyBookings({ onClose }) {
  const bookings = useBookings()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/12 bg-[#0a0d14] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Ticket size={16} style={{ color: brand.gold }} /> My bookings
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {bookings.length === 0 ? (
            <div className="py-12 text-center text-white/45">
              <Ticket size={34} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No bookings yet.</p>
              <p className="mt-1 text-xs">Book a departure or an offer and it’ll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const cancelled = b.status === 'cancelled'
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    style={cancelled ? { opacity: 0.55 } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="truncate">{b.from}</span>
                        <ArrowRight size={13} className="shrink-0 text-white/40" />
                        <span className="truncate">{b.to}</span>
                      </div>
                      <Badge color={cancelled ? status.neutral : status.good}>
                        {cancelled ? 'Cancelled' : 'Confirmed'}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-white/55">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {b.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {b.departure} → {b.arrival}</span>
                      <span>{b.fareType}</span>
                      <span>{b.passengers} {b.passengers > 1 ? 'pax' : 'pax'}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-2">
                      <div className="text-[12px] text-white/45">
                        Ref <span className="tabular-nums text-white/70">{b.ref}</span> · card ····{b.paymentLast4}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: brand.gold }}>
                          {gbpFull(b.total)}
                        </span>
                        {!cancelled && (
                          <button
                            type="button"
                            onClick={() => cancelBooking(b.id)}
                            className="flex items-center gap-1 rounded-lg border border-white/12 px-2 py-1 text-[11px] text-white/60 transition hover:border-white/25 hover:text-white"
                          >
                            <Trash2 size={12} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {cancelled && (
                      <p className="mt-1.5 text-[11px]" style={{ color: status.good }}>
                        Refund of {gbpFull(b.total)} issued to card ····{b.paymentLast4} (demo).
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
