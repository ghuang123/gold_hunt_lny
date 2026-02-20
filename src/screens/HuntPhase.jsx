import { useEffect, useRef, useState } from 'react'
import { getRemainingSeconds } from '../lib/time'

function HuntPhase({ room, players, myId, onTimeout }) {
  const isSpeaker = room.current_player_id === myId
  const [, setTick] = useState(0)
  const firedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 250)
    return () => clearInterval(t)
  }, [])

  const total = 45 + (room.hunt_bonus_time || 0)
  const remaining = getRemainingSeconds(
    room.hunt_started_at,
    total,
    room.accumulated_pause_ms || 0,
    room.timer_paused_at
  )

  useEffect(() => {
    if (!isSpeaker) return
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      onTimeout()
    }
  }, [remaining, isSpeaker, onTimeout])

  const speaker = players.find((p) => p.id === room.current_player_id)

  return (
    <main className="screen hunt">
      <div className="sparks">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="spark"
            style={{ left: `${8 + i * 11}%`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>

      <div className="stack">
        <h2>{isSpeaker ? 'defend yourself 🔥' : 'the hunt is on 🔥'}</h2>
        <p className="small">
          {isSpeaker
            ? "answer everything. don't hesitate. don't crack."
            : 'ask sharp questions. find the crack.'}
        </p>

        <div className="card">
          <p className="small">{room.chosen_topic}</p>
          <p>{room.chosen_question}</p>
        </div>

        <div className="card">
          <div className="timer red">{Math.ceil(remaining)}</div>
          {room.hunt_bonus_time > 0 && (
            <p className="small">⚡ +{room.hunt_bonus_time}s bonus from campfire</p>
          )}
        </div>

        {!isSpeaker && speaker && (
          <p className="small">speaker: {speaker.zodiac} {speaker.name}</p>
        )}
      </div>
    </main>
  )
}

export default HuntPhase
