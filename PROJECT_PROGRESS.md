# Kenangan Kita MVP Progress Tracker

Last updated: 2026-05-02 (Phase 5.1 UX hardening + dashboard self-service complete)
Owner: Engineering

## Overall Status

- Current phase: Phase 6 (QR generation and share flow complete, Phase 7 next)
- Project health: In progress
- Architecture direction: Monorepo (Turbo + pnpm), shared logic in packages, Supabase backend

## Milestones

- [x] Architecture proposal finalized
- [x] Monorepo scaffold complete
- [x] Supabase schema and migrations complete
- [x] Event creation flow (admin) complete
- [x] Public event access via `event_code` complete
- [x] QR generation and scan flow complete
- [x] Admin auth gate complete (Google SSO + email/password)
- [x] User RBAC management complete
- [x] Web camera capture complete
- [x] Upload + compression complete
- [x] Gallery complete
- [x] Admin controls complete
- [x] Vercel Analytics complete
- [x] User dashboard (self-service) complete
- [x] Event cover photo support complete
- [x] QR generation and scan flow complete
- [ ] Upload limits complete

## Phase Breakdown

### Phase 1 - Foundation

- [x] Workspace initialized (`pnpm-workspace.yaml`, `turbo.json`)
- [x] `apps/web` scaffolded (Next.js App Router + Tailwind)
- [x] `apps/mobile` scaffolded (Expo placeholder)
- [x] Shared packages scaffolded (`ui`, `lib`, `config`)
- [x] Supabase project folder scaffolded
- [x] Initial SQL migration added (`events`, `photos`, indexes)
- [x] Initial RLS policy plan documented

### Phase 2 - Capture + Upload

- [x] Camera abstraction in shared lib
- [x] Web camera implementation (`getUserMedia`)
- [x] Camera flip (front/back) with animation
- [x] Flash support (screen flash for front, hardware torch for back)
- [x] Auto-name for logged-in users; required nickname for guests
- [x] Camera startup fix (black screen / first-permission-grant / incognito)
- [x] Image preview and retake flow
- [x] Client-side compression
- [x] Upload to Supabase Storage
- [x] Persist photo metadata in DB

### Phase 3 - Gallery

- [x] Public gallery route per event
- [x] Lazy-loading image grid
- [x] Reveal mode handling (instant vs after event)
- [x] Photo overlay (uploader name + timestamp)
- [x] Back-to-camera navigation

### Phase 4 - Admin

- [x] Admin event dashboard
- [x] Delete photo action
- [x] Toggle gallery visibility

### Phase 5 - Admin Auth Gate (Google SSO + Email/Password)

- [x] Add `/admin/login` page with Google OAuth entry
- [x] Add email/password sign-in on login page
- [x] Add OAuth callback handler (`/auth/callback`)
- [x] Protect `/admin/*` routes via middleware
- [x] Enforce admin role check via `admin_profiles`
- [x] Fix redirect host under reverse proxy (ngrok x-forwarded-host)
- [x] Persistent header with user avatar and sign-out on all authenticated pages
- [x] Show authenticated email + sign-out option on denied screen
- [x] Auto-provision first-time Google sign-ins with default `user` role
- [x] Admin can view user list and toggle role (`admin` / `user`)
- [x] RBAC policies expanded for admin-managed role updates

### Phase 5.1 - UX Hardening + User Dashboard (Self-Service)

#### Dashboard
- [x] User dashboard (`/dashboard`) with tab navigation: Dashboard | Create | Events
- [x] Dashboard data extraction into shared `lib/data/dashboard.ts` (types + fetch function)
- [x] `EventCard` component extracted — shows active/closed badge, camera/gallery/manage actions
- [x] Events tab shows events created by the logged-in user (via `listEventsByCreator`)
- [x] Create tab renders `CreateEventForm` inline (no navigation required)
- [x] `+` circular pill button in bottom nav for quick event creation

#### Event Creation
- [x] Standalone `/events/new` page accessible to all authenticated users (not admin-only)
- [x] Cover photo support: camera capture + gallery picker, upload to `event-covers` bucket
- [x] `createEvent()` now correctly stores `created_by` using SSR-aware browser client
- [x] `event-covers` public Supabase bucket + RLS policies (migration `0012`)
- [x] `events.cover_image_path` schema column added (migration `0012`)

#### Event Guest Tracking
- [x] `events.created_by` column defaults to `auth.uid()` (migration `0010`)
- [x] `event_guests` table — auto-populated via trigger on photo upload (migration `0010`)
- [x] Backfill `event_guests` from existing photos (migration `0010`)
- [x] Backfill `created_by` from `admin_profiles` for legacy events (migration `0011`)

#### Shared UI Components
- [x] Shared `UserMenu` component — clickable avatar dropdown with sign-out, used by `/admin` and `/dashboard`
- [x] Auth-aware `LandingNav` server component — shows Dashboard link + UserMenu when logged in, Sign In when not
- [x] Middleware fixed: `x-pathname` now forwarded on request headers for public paths (was response-only, breaking `ConditionalHeader`)

#### Admin Improvements
- [x] Admin event list shows "Created by" field (resolved from user profiles)
- [x] Admin header has "Dashboard" link back to `/dashboard`
- [x] `/admin/events/new` redirects to `/events/new` (unified creation flow)

#### Guest Event Pages (`/e/[eventCode]`)
- [x] Cover photo displayed on event landing page (from `event-covers` public bucket)
- [x] Footer logo replacing plain text on event landing + gallery pages
- [x] Gallery page redesigned: sticky header with back nav + Live/Closed badge, cover banner, Add Photo button
- [x] Gallery empty state upgraded: icon + bold heading + subtext (replaced plain `<p>`)

### Phase 6 - QR Generation + Share Flow

- [x] Generate QR for guest link on event creation success
- [x] Add actions: copy link, download QR, open guest page
- [x] Show QR block on event admin dashboard
- [x] Add print-friendly QR card layout

### Phase 7 - Upload Limits (Admin Controlled)

- [ ] Add event-level config (`upload_limit_enabled`, `max_uploads_per_session`, `max_uploads_total`)
- [ ] Track guest sessions and upload counts
- [ ] Enforce limits during upload finalization
- [ ] Add admin controls and usage counters

### Phase 8 - Event Modes (Preset Setup)

- [ ] Add event mode presets (`wedding`, `party`, `open_house`, `custom`)
- [ ] Define preset defaults for reveal mode, upload limits, and gallery visibility
- [ ] Add preset selector in event creation flow
- [ ] Allow admin override after preset is applied

### Phase 9 - Smart Upload Resilience [best to implement this at mobile apps, skip for web dev]

- [ ] Add offline queue for pending uploads on web
- [ ] Add automatic retry with backoff for failed uploads
- [ ] Add upload status indicators (`queued`, `retrying`, `failed`, `uploaded`)
- [ ] Add manual retry action for failed uploads

### Phase 10 - Live Slideshow Mode

- [ ] Add public/slideshow route optimized for TV display
- [ ] Add autoplay with interval controls and pause/resume
- [ ] Add event filtering and "latest photos first" mode
- [ ] Add safe refresh/reconnect behavior for long-running display sessions

### Phase 11 - Moderation Enhancements

- [ ] Add bulk select on admin gallery
- [ ] Add bulk delete / bulk hide actions
- [ ] Introduce `hidden` moderation state separate from delete
- [ ] Add lightweight reported photo queue for review

### Phase 12 - Download / Export

- [ ] Add event export action in admin dashboard
- [ ] Generate ZIP package by event
- [ ] Support filename structure options (date/name)
- [ ] Add export job status and downloadable link

### Phase 13 - Guest Engagement

- [ ] Add optional reactions (e.g. ❤️) without login
- [ ] Add "Thanks" completion screen with CTA to gallery
- [ ] Add simple engagement counters per photo
- [ ] Add admin toggle to enable/disable engagement features

## Immediate Next Tasks

1. Seed one super-admin account in `admin_profiles` (`role = admin`) for production bootstrap.
2. Validate RBAC flow end-to-end: first login => `user`, promote/demote via `/admin/users`.
3. Build Phase 7 upload limits and enforcement path.

## Product Enhancements Backlog (Mapped to Phases)

1. Event modes presets (Phase 8).
2. Offline upload queue + retry (Phase 9).
3. Live slideshow mode (Phase 10).
4. Moderation workflow upgrades (Phase 11).
5. Export/ZIP capability (Phase 12).
6. Guest engagement features (Phase 13).

## Risks / Notes

- Guest upload without login requires careful RLS/storage policy design.
- High event concurrency (500-1000 users) requires optimized image size and CDN caching.
- Need strict separation of domain logic from web pages to keep Expo migration easy.
- Camera UX refinement applied: prevent re-upload spam, provide next actions after success, and tune stream constraints for smoother preview.
- Gallery phase implemented: paginated photo loading, mobile-first grid, and reveal-mode gate based on event settings/date.
- Admin phase implemented: per-event dashboard, gallery visibility toggle, and photo soft-delete moderation flow.
- Phase 5 implemented and verified: Google SSO + email/password login, middleware auth gate, admin_profiles role enforcement, reverse-proxy-safe redirects, persistent header with avatar.
- Camera UX hardened: flip animation (scaleX), flash (screen overlay for front / torch for back), auto-name from auth session, required guest nickname, black screen / incognito / first-permission-grant startup fix.
- Phase 5.1 completed: user dashboard (self-service create + events), event cover photo, shared UserMenu, auth-aware landing nav, middleware x-pathname fix, admin event list creator info, gallery page redesign.
- `createEvent()` now uses SSR-aware browser client — `created_by` is reliably persisted; legacy data backfilled via migrations 0010/0011.
- Gallery UX improved: photo overlay with uploader name + timestamp, back-to-camera link.
- Vercel Analytics added (`@vercel/analytics/next`) to root layout — live on next deploy.
- Enhancement roadmap formalized into Phases 8-13 for incremental delivery.
- RBAC management delivered before Phase 6: default `user` provisioning on first login + admin role management screen.

