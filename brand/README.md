# RailSmart — Brand Assets

The RailSmart logo: an aerodynamic **train-front** mark in the product's gold, with the
**RailSmart** wordmark. Built from the identity already used in the app (train-front icon +
gold `#C5A880` + wordmark).

## Files

| File | Use |
|------|-----|
| `railsmart-mark.svg` | The mark only (gold train nose, transparent). Use on any background. |
| `railsmart-badge.svg` | The mark on a dark rounded badge. **App icon / favicon / avatar.** |
| `railsmart-logo-dark.svg` | Horizontal lockup (mark + wordmark) for **dark** backgrounds. |
| `railsmart-logo-light.svg` | Horizontal lockup for **light** backgrounds. |
| `png/railsmart-icon-1024.png` | 1024² app icon (mobile). |
| `png/railsmart-favicon-256.png`, `-48.png` | Raster favicons. |
| `png/railsmart-mark-512.png` | Mark only, transparent. |
| `png/railsmart-logo-dark-1600.png`, `-light-1600.png` | Lockups, transparent — drop onto slides. |

SVGs are resolution-independent — prefer them wherever the tool accepts SVG (PowerPoint 2016+,
web, Figma). PNGs are for places that need raster (mobile icon, older tools).

## Colours

| Token | Hex | Where |
|-------|-----|-------|
| Gold (brand) | `#C5A880` | the mark, "Smart" in the wordmark |
| Gold light | `#E6D2AD` | top of the mark's gradient |
| Gold deep | `#9C7F57` | bottom of the gradient |
| Ink (navy) | `#0D1826` | "Rail" on light backgrounds |
| Badge navy | `#12203A → #080F1C` | badge background |
| Windscreen | `#0C1424 → #1C2B46` | the mark's visor / cut-outs |

The gold matches `dashboard-web/src/lib/theme.js` (`brand.gold = '#C5A880'`).

## Clear space & minimum size

- Keep padding around the lockup of at least the height of the badge's corner radius.
- Don't stretch, recolour, or re-space the wordmark. Don't put the dark badge on a dark
  background without its subtle gold hairline (already built in).
- Minimum legible sizes: badge **24 px**, full lockup **120 px** wide.

## Dropping it into the project

- **Website favicon:** copy `railsmart-badge.svg` to `dashboard-web/public/favicon.svg`
  (replaces the default Vite mark). The `<link rel="icon">` in `index.html` already points there.
- **Mobile app icon:** replace `mobile/assets/icon.png` with `png/railsmart-icon-1024.png`
  (and `favicon.png` with `png/railsmart-favicon-48.png`).
- **Slides / title slide:** use `png/railsmart-logo-dark-1600.png` on the dark template.
