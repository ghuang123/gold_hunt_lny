import { useMemo, useState } from 'react'

const COPY = [
  'once every 60 years. make it count.',
  'the fire horse punishes hesitation.',
  'the horse moves forward. always forward.',
  'speed. clarity. no second chances.',
]

function ChosenPhase({ room, players, myId, onReady }) {
  const [copy] = useState(() => COPY[Math.floor(Math.random() * COPY.length)])
  const isSpeaker = room.current_player_id === myId
  const activePlayers = useMemo(
    () => players.filter((p) => p.is_active),
    [players]
  )
  const sorted = useMemo(
    () => [...activePlayers].sort((a, b) => b.score - a.score),
    [activePlayers]
  )
  const stillToGo = useMemo(
    () => activePlayers.filter((p) => !p.has_played_turn && p.id !== room.current_player_id),
    [activePlayers, room.current_player_id]
  )
  const lastRound = stillToGo.length <= 1

  if (isSpeaker) {
    return (
      <main className="screen">
        <div className="stack items-center">
          <div className="chosen-emoji">{activePlayers.find((p) => p.id === myId)?.zodiac}</div>
          <h2>you've been chosen 🐴</h2>
          <p className="small">{copy}</p>
          <p>the room is watching.</p>
          <p className="phase-next">next: pick your question + fate.</p>
          <button className="btn" type="button" onClick={onReady}>
            i'm ready →
          </button>
        </div>
      </main>
    )
  }

  const speaker = activePlayers.find((p) => p.id === room.current_player_id)

  return (
    <main className="screen">
      <div className="stack">
        <div className="card">
          <h2>{speaker?.zodiac} {speaker?.name} is getting ready...</h2>
          <p className="small">{copy}</p>
          <p className="phase-next">next: they pick a question, then speak for 45s.</p>
        </div>

        <div className="card">
          <p className="small">scores 🪙</p>
          <div className="scoreboard">
            {sorted.map((p, idx) => (
              <div key={p.id} className={`score-row ${p.id === room.current_player_id ? 'current' : ''}`}>
                <span className="score-rank">{idx + 1}.</span>
                <span className="score-name">{p.zodiac} {p.name}</span>
                <span className="score-points">{p.score} 🪙</span>
                <span className="score-delta">+{p.score_delta}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="small">still to go · {stillToGo.length} left</p>
          {lastRound ? (
            <p className="small">last round 🔥</p>
          ) : (
            <div className="still-list">
              {stillToGo.map((p) => (
                <span key={p.id} className="chip">{p.zodiac} {p.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default ChosenPhase
