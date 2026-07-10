# RailSmart — Mobile (Expo)

The RailSmart passenger + operations app for phones, built with **Expo (SDK 54)**
so it runs in **Expo Go** with no native build step. All three web roles are
mirrored:

| Tab | Screen | Notes |
|-----|--------|-------|
| **Analytics** | Network overview — KPIs, service punctuality, regional revenue, seating classes, sales trend | same real dataset as the web app |
| **Passenger** | Journey planner, live departures, **booking flow**, offers, My Bookings | full book → simulated payment → manage |
| **Operations** | Fleet status (filterable), maintenance queue, delay watch, delay analytics | |

Charts are drawn with plain React Native views (no native chart module), so
everything is Expo Go-compatible. The 3D train and CCTV video from the web app
are desktop-only and intentionally omitted here.

## Run it in Expo Go

1. Install the **Expo Go** app on your phone (App Store / Play Store).
2. On this machine:
   ```bash
   cd mobile
   npx expo start
   ```
3. Scan the QR code with Expo Go (Android) or the Camera app (iOS). Phone and
   computer must be on the **same Wi-Fi**. If they aren't, use a tunnel:
   ```bash
   npx expo start --tunnel
   ```

## Booking (demo)

- Book from any departure or tap an offer.
- The card form is a **simulated checkout** — no real payment. Use a test card
  like `4242 4242 4242 4242`, any future expiry, any 3-digit CVC.
- Bookings persist on-device via AsyncStorage; manage/cancel them from **My
  bookings** (ticket icon, top-right of the Passenger tab).

## Stack

- Expo SDK 54 · React Native 0.81 · React 19 (matches Expo Go's SDK 54)
- **Zustand** + AsyncStorage for bookings (mobile skill §2/§4 defaults)
- `@expo/vector-icons`, `react-native-safe-area-context`
- Real figures bundled from `src/data/*.json` (exported from the cleaned dataset)

## Structure

```
App.js                     shell: header + bottom tabs
src/theme.js               design tokens (mirrors web)
src/store/bookings.js      Zustand + AsyncStorage bookings store
src/components/ui.js       Card / StatCard / Pill / HBar / Chip / SectionHeader
src/screens/               DataEngineer / Passenger / StationManager
src/booking/               BookingSheet (book+pay) · MyBookingsSheet (manage)
src/data/*.json            real dashboard / passenger / manager figures
```
