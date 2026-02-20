# Decisions

## Locked
- Stack: Vite + React.
- Backend: Supabase (free).
- Hosting: Cloudflare Pages (free).
- Max players per room: 8.
- Scores carry over across play-again in the same room.
- Next speaker computed on demand from players table.
- QA arrows: always visible, host-only actions.

## Data Model
- rooms includes: current_topic, result_processed_at, timer_paused_at, accumulated_pause_ms.
- players includes: score_delta.

## Copy
- All UI text is lowercase.
- Voting headline rotates from VOTING_PROMPTS and stays fixed per phase.
