# AGENTS.md

## Project
Gold Hunt: Year of the Fire Horse — realtime party game.

## Goals
- Build the full game flow defined in the PRD.
- Ship a working, deployable web app with Supabase realtime.
- Keep the build small, deterministic, and easy to run locally.

## Key Decisions (Living)
- Hosting: Cloudflare Pages (free).
- Backend: Supabase (free).
- Realtime tables: rooms, players, votes.
- Max players per room: 8.
- Scores carry over across "play again" sessions within the same room.

## Conventions
- Keep tasks small and scoped (1-2 features per change).
- Prefer explicit state transitions and idempotent updates.
- All UI text is lowercase.
- No external fonts; system font stack only.
- Avoid TODOs/placeholders in final code.

## Environment Variables
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

## Secrets
- Never commit secrets to git.
- Store keys in `.env` locally and in hosting env vars.

## Commands (TBD)
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Repository Hygiene
- Use small, focused commits.
- No destructive git commands unless explicitly requested.

## Open Decisions
- Frontend stack: Vite + React (recommended) or Next.js.
- CSS approach: CSS modules vs Tailwind vs styled-components.
