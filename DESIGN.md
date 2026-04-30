---
name: Kenangan Kita
colors:
  surface: "#ffffff"
  surface-dim: "#f8fafc"
  surface-bright: "#ffffff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f8fafc"
  surface-container: "#f1f5f9"
  surface-container-high: "#e2e8f0"
  surface-container-highest: "#cbd5e1"
  on-surface: "#0f172a"
  on-surface-variant: "#475569"
  inverse-surface: "#0f172a"
  inverse-on-surface: "#f8fafc"
  outline: "#cbd5e1"
  outline-variant: "#e2e8f0"
  surface-tint: "#0f172a"
  primary: "#0f172a"
  on-primary: "#ffffff"
  primary-container: "#1e293b"
  on-primary-container: "#e2e8f0"
  inverse-primary: "#94a3b8"
  secondary: "#475569"
  on-secondary: "#ffffff"
  secondary-container: "#f1f5f9"
  on-secondary-container: "#0f172a"
  tertiary: "#15803d"
  on-tertiary: "#ffffff"
  tertiary-container: "#dcfce7"
  on-tertiary-container: "#14532d"
  error: "#b91c1c"
  on-error: "#ffffff"
  error-container: "#fef2f2"
  on-error-container: "#991b1b"
  primary-fixed: "#334155"
  primary-fixed-dim: "#1e293b"
  on-primary-fixed: "#f8fafc"
  on-primary-fixed-variant: "#cbd5e1"
  secondary-fixed: "#e2e8f0"
  secondary-fixed-dim: "#cbd5e1"
  on-secondary-fixed: "#0f172a"
  on-secondary-fixed-variant: "#334155"
  tertiary-fixed: "#bbf7d0"
  tertiary-fixed-dim: "#86efac"
  on-tertiary-fixed: "#052e16"
  on-tertiary-fixed-variant: "#166534"
  background: "#f8fafc"
  on-background: "#0f172a"
  surface-variant: "#f1f5f9"
  warning: "#b45309"
  warning-container: "#fffbeb"
  on-warning-container: "#92400e"
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.03em
  mono-sm:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.25rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  container-padding-mobile: 16px
  container-padding-desktop: 24px
  section-gap: 24px
  card-padding: 24px
  card-padding-sm: 16px
  max-width-guest: 448px
  max-width-admin: 896px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
  button-secondary:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
    border: 1px solid {colors.outline}
  button-secondary-hover:
    backgroundColor: "{colors.surface-container-low}"
  button-danger:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.error}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
    border: 1px solid {colors.error-container}
  input-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 40px
    border: 1px solid {colors.outline}
  input-field-focus:
    border: 1px solid {colors.on-surface-variant}
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
    border: 1px solid {colors.outline}
  card-sm:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding-sm}"
    border: 1px solid {colors.outline}
  photo-card:
    backgroundColor: "{colors.surface-container}"
    rounded: "{rounded.lg}"
    overflow: hidden
  photo-overlay:
    backgroundColor: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)"
    textColor: "#ffffff"
  badge-gallery-open:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 2px 6px
  badge-gallery-closed:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 2px 6px
  nav-header:
    backgroundColor: "{colors.surface-container-lowest}"
    border: 1px solid {colors.outline}
    padding: 8px 16px
  avatar-fallback:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.full}"
    size: 32px
  error-banner:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    rounded: "{rounded.sm}"
    border: 1px solid rgba(185,28,28,0.2)
    padding: 8px 12px
  warning-banner:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.on-warning-container}"
    rounded: "{rounded.sm}"
    border: 1px solid rgba(180,83,9,0.2)
    padding: 12px
  code-display:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.sm}"
    border: 1px solid {colors.outline}
    padding: 8px
---

## Brand & Style

Kenangan Kita — *"Our Memories"* in Malay — is a browser-native digital disposable
camera designed for in-person events. Guests scan a QR code, snap photos directly
from their phone browser without any app download, and watch a shared gallery
come alive in real time. The product sits at the intersection of nostalgia and
convenience: the magic of passing a disposable camera around a wedding table,
translated into an instant, zero-friction mobile experience.

The current visual identity is **minimal and purposeful** — a monochromatic slate
palette anchored in near-black (`#0f172a`) and clean white surfaces. The design is
deliberately unobtrusive so that the **photos** themselves become the star.
Everything else — navigation, controls, forms — recedes quietly. The aesthetic
is closer to a premium utility than a consumer social app.

The UI leans strongly **mobile-first**: almost every guest-facing screen is
constrained to a single-column layout within a `max-w-md` container (448px),
mimicking the feel of a native camera or gallery app delivered entirely in the
browser.

## Colors

The palette is derived almost entirely from Tailwind CSS's slate scale, giving the
product a cool, clean, editorial feel.

- **Primary / CTA:** Near-black (`#0f172a`, slate-900) is used for all high-emphasis
  action buttons — "Get Started", "Open Camera", "Copy Link", "Sign in". This
  creates strong contrast and a sense of authority without resorting to a brand
  color.
- **Surfaces:** Page backgrounds alternate between `#f8fafc` (slate-50) for full-page
  contexts and pure white for cards, modals, and input fields, creating a
  subtle two-level hierarchy without visible shadows.
- **Text:** Primary content uses slate-900 (`#0f172a`), secondary and supporting text
  uses slate-600 (`#475569`), and tertiary / metadata uses slate-500/400.
- **Borders:** Consistently `#cbd5e1` (slate-200) and `#e2e8f0` (slate-300) — thin,
  quiet lines that define containers without adding visual weight.
- **Semantic Colors:** Three semantic states are used sparingly:
  - **Success / Gallery Open:** `bg-green-100 text-green-700` — a soft indicator
    that the event gallery is publicly visible.
  - **Warning / Gallery Hidden:** `bg-amber-50 text-amber-700` — guests informed
    the gallery is not yet open.
  - **Error:** `bg-red-50 text-red-700` — used for form errors, failed uploads, and
    the Danger Zone section in admin.
- **Photo Overlay:** Gallery photo cards use a `rgba(0,0,0,0.6)` to `transparent`
  gradient rising from the bottom, white text for attribution labels — the only
  true dark-on-image treatment in the product.

## Typography

**Inter** is the sole typeface, loaded via the system font stack. It is chosen for
its exceptional screen legibility at small sizes and neutral, professional
character that does not distract from photo content.

- **Display / Hero:** 36–48px, `font-bold`, `tracking-tight` — used on the landing
  page to establish scale and welcome new visitors.
- **Page Headings:** 20–24px, `font-semibold` — used for section titles within admin
  and event pages.
- **Body:** 14–16px (`text-sm` / `text-base`), regular weight — the workhorse for
  all descriptive copy.
- **Labels / Metadata:** 12px (`text-xs`), medium weight — used extensively for
  timestamps, event codes, badge text, and button labels on compact UI.
- **Monospace:** System monospace stack at 13px — used for guest URLs and event
  codes to signal "copyable technical string."
- Typographic hierarchy is enforced entirely through weight and color shifts within
  Inter, without relying on italic or decorative variants.

## Layout & Spacing

The layout strategy is **dual-track**: guest-facing flows are single-column,
phone-sized (`max-w-md`, 448px); admin flows widen to `max-w-4xl` (896px) for
a more desktop-friendly data management experience.

- **Base Unit:** 8px grid. All spacing values (`px-4`, `py-8`, `gap-3`) are
  multiples of 4px/8px.
- **Page Padding:** `px-4` (16px) on mobile, `px-6` (24px) on wider breakpoints.
- **Section Separation:** `py-8` to `py-20` on major sections; `space-y-3` to
  `space-y-6` for stacked component groups.
- **Photo Grid:** A consistent 2-column grid (`grid-cols-2 gap-2`) is used for both
  the guest gallery and admin photo management, creating a dense, magazine-style
  mosaic.
- **Navigation:** Sticky top header, `max-w-4xl` centered, `py-2` — compact and
  out of the way.
- **Forms:** Constrained to `max-w-md`, vertically stacked, `space-y-3` between
  fields.

## Elevation & Depth

This design system is **flat-first**: depth is communicated through **tonal shifts
and borders** rather than drop shadows.

- **Primary Layer:** `bg-white` cards with `border border-slate-200` float above a
  `bg-slate-50` page background — achieving a perceivable lift with zero blur.
- **No Shadow Vocabulary:** The codebase has no `shadow-*` utility classes in use,
  keeping the visual weight extremely low and loading performance high.
- **Interactive Lift:** Hover states use `hover:bg-slate-50` to shift the card
  surface by one tonal step, giving tactile feedback without motion.
- **Loading Overlays:** During navigation, a semi-transparent `bg-white/60` overlay
  is applied on top of card content while a spinner renders — a lightweight
  depth signal for asynchronous operations.
- **Photo Cards in Gallery:** The gradient overlay (`from-black/60 to-transparent`)
  is the one place real depth/contrast rendering occurs, used purposefully to
  keep photo attribution readable on any photo content.

## Shapes

The shape language mixes **sharp utility edges for small controls** with **softer
containers for larger surfaces**.

- **Small Buttons & Inline Actions:** `rounded` (4px) — tight, precise, utilitarian.
  Used for admin control buttons, badges, and compact form actions.
- **Primary Buttons & Input Fields:** `rounded-lg` (8px) — slightly softer, the
  dominant button treatment across both guest and admin flows.
- **Cards & Feature Containers:** `rounded-xl` (12px) — used for the login card,
  feature sections on landing, event creation success card, and photo article
  elements. Creates a friendly, contained feel.
- **Avatars:** `rounded-full` (9999px) — user avatar images and the initial
  fallback pill.
- **Photo Thumbnails:** `rounded` to `rounded-lg` depending on context — photos
  use mild rounding to feel organic rather than perfectly rectangular.

## Components

### Buttons

Three distinct button tiers exist:

**Primary** (`bg-slate-900 text-white rounded-lg`) — used for all main call-to-actions:
"Get Started", "Open Camera", "Sign in", "Copy Link", "New Event". Full-width on
mobile, auto-width on desktop. Loading state shows an inline spinner + "Loading…"
text with `disabled:opacity-60`.

**Secondary / Ghost** (`border border-slate-200 text-slate-700 hover:bg-slate-50`) —
used for lower-priority actions alongside a primary button. "How it works",
"Open Gallery", "Sign out".

**Danger** (`border border-red-200 text-red-700 hover:bg-red-100`) — used in the
admin Danger Zone for destructive operations. Requires a two-step confirmation
before the final destructive action fires.

### Cards

Cards are `bg-white border border-slate-200 rounded-xl p-4/p-6` — the primary
container atom. They hold event listings, gallery visibility controls, login
forms, and event detail sections. There is no card elevation; the white-on-slate-50
background contrast is sufficient.

### Photo Cards

Gallery photo cards are full-bleed image tiles in a 2-column grid. They are
`rounded-lg overflow-hidden`, aspect-ratio-constrained (`h-44` or `h-36`), and
include a bottom gradient overlay carrying the photographer's nickname and
timestamp in white text. Empty states use a `bg-slate-100` placeholder with
muted copy.

### Forms & Inputs

Input fields are `rounded border border-slate-200 px-3 py-2.5 text-sm` with a
`focus:border-slate-400` focus ring — no colored outline, keeping everything
within the neutral palette. Required validation is handled by native HTML
`required` plus client-side state, with error messages rendered as inline red
banners directly above or below the relevant action.

### Navigation

The admin sticky header is `bg-white border-b border-slate-200 sticky top-0 z-10`,
containing logo left and user avatar + sign-out button right. The logo (`/logo.png`)
acts as the sole brand anchor on every authenticated page.

### Status Badges

Tiny inline `rounded px-1.5 py-0.5 text-xs` pills communicate event gallery
state: green for "Gallery Open", gray for "Gallery Closed". These are the only
persistent semantic color elements visible in the main list view.

### Camera UI

The camera capture view is a full-screen mobile experience with a live `<video>`
feed, overlay controls (flip camera, flash toggle), and a large circular capture
button. After capture, the image preview fills the same area with "Retake" /
"Upload" actions below. The UI is entirely borderless and full-bleed during
capture to maximise the viewfinder.
