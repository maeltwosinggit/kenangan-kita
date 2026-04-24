# Kenangan Kita MVP Progress Tracker

Last updated: 2026-04-22 (Phase 4 complete)
Owner: Engineering

## Overall Status

- Current phase: Phase 4 (Admin controls)
- Project health: In progress
- Architecture direction: Monorepo (Turbo + pnpm), shared logic in packages, Supabase backend

## Milestones

- [x] Architecture proposal finalized
- [x] Monorepo scaffold complete
- [x] Supabase schema and migrations complete
- [ ] Event creation flow (admin) complete
- [ ] Public event access via `event_code` complete
- [ ] QR generation and scan flow complete
- [x] Web camera capture complete
- [x] Upload + compression complete
- [x] Gallery complete
- [x] Admin controls complete

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
- [x] Image preview and retake flow
- [x] Client-side compression
- [x] Upload to Supabase Storage
- [x] Persist photo metadata in DB

### Phase 3 - Gallery

- [x] Public gallery route per event
- [x] Lazy-loading image grid
- [x] Reveal mode handling (instant vs after event)

### Phase 4 - Admin

- [x] Admin event dashboard
- [x] Delete photo action
- [x] Toggle gallery visibility

## Immediate Next Tasks

1. Validate full admin flow (create event -> dashboard -> toggle -> delete).
2. Add QR code generation and deep link on admin event creation.
3. Tighten RLS/storage policies for production-safe guest uploads.
4. Add optional admin auth gate for dashboard routes.

## Risks / Notes

- Guest upload without login requires careful RLS/storage policy design.
- High event concurrency (500-1000 users) requires optimized image size and CDN caching.
- Need strict separation of domain logic from web pages to keep Expo migration easy.
- Camera UX refinement applied: prevent re-upload spam, provide next actions after success, and tune stream constraints for smoother preview.
- Gallery phase implemented: paginated photo loading, mobile-first grid, and reveal-mode gate based on event settings/date.
- Admin phase implemented: per-event dashboard, gallery visibility toggle, and photo soft-delete moderation flow.

