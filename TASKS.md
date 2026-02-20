# TASKS.md

## Build Plan (High-Level)
1. Scaffold Vite + React app.
2. Wire Supabase client and env vars.
3. Implement screens + routing.
4. Implement realtime hooks.
5. Implement phase state machine + timers.
6. Implement scoring + results + leaderboard.
7. QA pass + fixes.
8. Deploy to Cloudflare Pages.

## Milestones (Tight Scope)
- M1: App shell + landing + courtyard.
- M2: Lobby + realtime players.
- M3: Core game loop (chosen → fate → campfire → hunt → voting → result).
- M4: Leaderboard + hall of fame.
- M5: QA navigation arrows + edge cases.

## Acceptance Checklist (Condensed)
- All phases transition correctly and never stall.
- Realtime updates for rooms, players, votes.
- Timers use server timestamps and pause logic.
- Scoreboard + score_delta render properly.
- Play again preserves scores and resets turn order.

## Notes
- Keep changes small and test after each milestone.
