import { useEffect, useRef, useState } from 'react'
import { getRemainingSeconds } from '../lib/time'
import FateEnvelope from '../components/FateEnvelope.jsx'

function CampfirePhase({ room, players, myId, onDoneTalking, onTimeout }) {
  const isSpeaker = room.current_player_id === myId
  const [, setTick] = useState(0)
  const firedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 250)
    return () => clearInterval(t)
  }, [])

  const remaining = getRemainingSeconds(
    room.campfire_started_at,
    45,
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
  const showButton = remaining <= 25

  return (
    <main className="screen campfire">
      <div className="stack">
        <p className="small">topic: {room.chosen_topic}</p>
        {isSpeaker && <FateEnvelope fateIsTruth={room.fate_is_truth} compact />}
        <div className="card">
          <p>{room.chosen_question}</p>
        </div>

        <div className="card">
          <div className="timer">{Math.ceil(remaining)}</div>
          {!showButton && (
            <p className="small">answer the question. you must speak for 20 seconds.</p>
          )}
          {showButton && (
            <p className="small">you can finish your story now — any time left becomes hunt time. 🔥</p>
          )}
          <p className="phase-next">next: the hunt starts when you end or time hits 0.</p>
        </div>

        {isSpeaker ? (
          showButton && (
            <button className="btn fade-in" type="button" onClick={() => onDoneTalking(Math.floor(remaining))}>
              i'm done talking 🔥
              <span className="btn-sub">{Math.floor(remaining)}s left become hunt time</span>
            </button>
          )
        ) : (
          <div className="stack">
            <p className="small">listen carefully to {speaker?.name}... 🎧</p>
            <p className="phase-next">next: hunt — ask sharp questions.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default CampfirePhase
