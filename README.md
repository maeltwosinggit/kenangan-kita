# Kenangan Kita

Digital disposable camera for events (MVP).

## Stack

- Monorepo: Turborepo + pnpm workspace
- Web: Next.js (App Router) + Tailwind
- Mobile scaffold: Expo (React Native)
- Backend: Supabase (Postgres + Storage + Auth-ready)
- Shared logic/state: `@kenangan/lib` + React Query

## Project Structure

- `apps/web` - primary MVP web app
- `apps/mobile` - Expo scaffold (future)
- `packages/ui` - shared UI primitives
- `packages/lib` - shared business/domain logic
- `packages/config` - shared constants and ts config
- `supabase` - local config and SQL migrations
- `PROJECT_PROGRESS.md` - milestone tracking

## Getting Started

1. Install pnpm (or fix corepack and enable pnpm).
2. Install dependencies:
   - `pnpm install`
3. Copy env file:
   - copy `apps/web/.env.example` to `apps/web/.env.local`
4. Start dev:
   - `pnpm dev`

## Current Build Status

- Monorepo scaffold: complete
- Supabase migrations: complete
- Event create + event code access routes: starter implementation added
- Camera, upload, gallery, admin controls: next phases