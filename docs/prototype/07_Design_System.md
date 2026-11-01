# Vinci — Design system
Version 1.0 · 1 November 2026 · Existing-brand reference

## Direction
Noir & Gold, editorial magazine presentation for handmade creators. Preserve the established dark canvas and craft-led hierarchy; this document describes the current brand, not a redesign.

## Typography
Display: Syne (500–800). Body/interface: Plus Jakarta Sans (300–700). Root loads Google Fonts; local network access is needed and system fallbacks apply. Use semantic heading order and readable labels. Existing CSS gives headings negative letter spacing and the home headline uses viewport sizing; future changes should use zero tracking and bounded responsive sizing rather than copying these exceptions.

## Tokens (src/styles.css)
| Role | Token value |
|---|---|
| Background | oklch(0.145 0 0) |
| Foreground | oklch(0.96 0.02 90) |
| Card / popover | oklch(0.18 0 0) |
| Primary / gold | oklch(0.78 0.13 85) |
| Primary foreground | oklch(0.145 0 0) |
| Secondary / muted | oklch(0.22 0 0) |
| Muted foreground | oklch(0.65 0.02 90) |
| Accent / gold-soft | oklch(0.88 0.1 90) |
| Destructive | oklch(0.6 0.22 25) |
| Border | oklch(0.28 0.02 85 / 40%) |
| Input | oklch(0.28 0.02 85 / 30%) |
| Ring | oklch(0.78 0.13 85) |

Base radius: 0.5rem (8px); smaller radii derived from it. Use semantic Tailwind roles, not raw colours in new page code. Current sample catalogue includes raw per-craft colours and gradients; these are legacy exceptions, not preferred reusable tokens.

## Layout and components
Shared header/footer; constrained editorial page widths; stream cards; unframed full-width sections; category feeds; tabs for profile/stream panels; modal purchase/certificate demonstrations. Reuse components/ui controls for buttons, forms, tabs, dialogs and tooltips. Current pages still contain raw buttons; standardising them is deferred rather than included in this handover.

## Content conventions
Cowries are the platform-wide payment unit. GBP appears for purchase conversion and payout illustration. Visitor Number is not an Artist ID. Verification marks, ART IDs, token IDs and certificate labels in mock content are not claims of actual verification. Public profile location is an intended discovery signal; private wallet/account fields must not become publicly queryable.

## Interaction and accessibility
Clearly indicate disabled, pending, empty, validation and failure states. Keep keyboard focus visible and use accessible names for icons. Respect prefers-reduced-motion; the current pulse/float animations need a full audit before commercial release. Test text wrapping, dialogs, tab navigation and room controls on narrow and wide screens.

## Media and 3D honesty
Most catalogue visuals are generated CSS/SVG abstractions, not photographs of actual saleable works; current gallery is faux-3D. A real sales gallery requires consistent photographs/scans, dimensioned models, scale references, material/condition descriptions and interactive 3D viewing. Do not substitute atmospheric imagery for inspectable artwork. No bundled photo/media set exists in the current source.
