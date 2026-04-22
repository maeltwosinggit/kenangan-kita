# Kenangan Kita MVP Progress Tracker

Last updated: 2026-04-22
Owner: Engineering

## Overall Status

- Current phase: Phase 1 (Monorepo setup + Supabase setup + Event + QR access)
- Project health: In progress
- Architecture direction: Monorepo (Turbo + pnpm), shared logic in packages, Supabase backend

## Milestones

- [x] Architecture proposal finalized
- [x] Monorepo scaffold complete
- [x] Supabase schema and migrations complete
- [ ] Event creation flow (admin) complete
- [ ] Public event access via `event_code` complete
- [ ] QR generation and scan flow complete
- [ ] Web camera capture complete
- [ ] Upload + compression complete
- [ ] Gallery complete
- [ ] Admin controls complete

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

- [ ] Camera abstraction in shared lib
- [ ] Web camera implementation (`getUserMedia`)
- [ ] Image preview and retake flow
- [ ] Client-side compression
- [ ] Upload to Supabase Storage
- [ ] Persist photo metadata in DB

### Phase 3 - Gallery

- [ ] Public gallery route per event
- [ ] Lazy-loading image grid
- [ ] Reveal mode handling (instant vs after event)

### Phase 4 - Admin

- [ ] Admin event dashboard
- [ ] Delete photo action
- [ ] Toggle gallery visibility

## Immediate Next Tasks

1. Run install and validate workspace scripts.
2. Add environment examples for web and Supabase.
3. Implement QR generation utility and wire into event creation view.
4. Build camera capture page with shared adapter interface.

## Risks / Notes

- Guest upload without login requires careful RLS/storage policy design.
- High event concurrency (500-1000 users) requires optimized image size and CDN caching.
- Need strict separation of domain logic from web pages to keep Expo migration easy.

