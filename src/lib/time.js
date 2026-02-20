export const getRemainingSeconds = (startedAt, totalSeconds, accumulatedPauseMs = 0, pausedAt = null) => {
  if (!startedAt) return totalSeconds
  const now = Date.now()
  const paused = pausedAt ? (now - new Date(pausedAt).getTime()) : 0
  const elapsed = (now - new Date(startedAt).getTime() - accumulatedPauseMs - paused) / 1000
  return Math.max(0, totalSeconds - elapsed)
}
