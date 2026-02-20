import { useMemo, useState } from 'react'

function FatePhase({ room, players, myId, onStartStory }) {
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

  const [selected, setSelected] = useState('')

  if (isSpeaker) {
    const fateLabel = room.fate_is_truth ? 'truth 🍵' : 'lie 🧨'
    const fateClass = room.fate_is_truth ? 'truth' : 'lie'

    return (
      <main className="screen">
        <div className="stack">
          <div className={`fate-badge ${fateClass}`}>{fateLabel}</div>
          <p className="small">your fate is set.</p>
          <p className="small">topic: {room.current_topic}</p>
          <p className="small">pick the question you want to answer</p>
          <p className="phase-next">next: 45s campfire, then the hunt.</p>

          <button
            className={`question-card ${selected === room.question_q1 ? 'selected' : ''}`}
            type="button"
            onClick={() => setSelected(selected === room.question_q1 ? '' : room.question_q1)}
          >
            <span className="q-label">q1</span>
            <span className="q-text">{room.question_q1}</span>
            {selected === room.question_q1 && <span className="check">✓</span>}
          </button>

          <button
            className={`question-card ${selected === room.question_q2 ? 'selected' : ''}`}
            type="button"
            onClick={() => setSelected(selected === room.question_q2 ? '' : room.question_q2)}
          >
            <span className="q-label">q2</span>
            <span className="q-text">{room.question_q2}</span>
            {selected === room.question_q2 && <span className="check">✓</span>}
          </button>

          <button
            className="btn"
            type="button"
            disabled={!selected}
            onClick={() => onStartStory(selected)}
          >
            start my story →
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
          <h2>{speaker?.zodiac} {speaker?.name} is choosing their question... 🔒</h2>
          <p className="phase-next">next: campfire (45s). listen up.</p>
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
          <div className="still-list">
            {stillToGo.map((p) => (
              <span key={p.id} className="chip">{p.zodiac} {p.name}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default FatePhase
