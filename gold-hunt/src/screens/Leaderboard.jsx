import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { updateHallOfFame } from '../lib/hallOfFame'

function Leaderboard({ room, players, isHost }) {
  const [hall, setHall] = useState([])

  const sorted = useMemo(
    () => [...players].filter((p) => p.is_active).sort((a, b) => b.score - a.score),
    [players]
  )

  useEffect(() => {
    updateHallOfFame(players, room.code)
  }, [players, room.code])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('hall_of_fame')
        .select('*')
        .order('score', { ascending: false })
        .limit(5)
      setHall(data || [])
    }
    load()
  }, [])

  const playAgain = async () => {
    if (!isHost) return
    await supabase.from('rooms').update({
      status: 'LOBBY',
      game_phase: 'CHOSEN',
      used_topics: [],
      current_player_id: null,
      fate_is_truth: null,
      hunt_bonus_time: 0,
      chosen_question: null,
      chosen_topic: null,
      current_topic: null,
      timer_paused_at: null,
      accumulated_pause_ms: 0,
      result_processed_at: null,
    }).eq('code', room.code)

    await supabase.from('players').update({
      has_played_turn: false,
      score_delta: 0,
      is_active: true,
      turn_order: null,
    }).eq('room_code', room.code)
  }

  const leave = async () => {
    const id = localStorage.getItem('gold_hunt_player_id')
    if (id) await supabase.from('players').update({ is_active: false }).eq('id', id)
    window.location.href = '/courtyard'
  }

  return (
    <main className="screen leaderboard">
      <div className="stack">
        <h2>the gold hunt ends</h2>
        <p>the fire horse has spoken 🐴🔥</p>
        <p className="small">mǎ dào chéng gōng.</p>

        <div className="card">
          <p className="small">leaderboard</p>
          {sorted.map((p, idx) => (
            <div key={p.id} className={`score-row ${idx === 0 ? 'first' : ''}`}>
              <span className="score-rank">#{idx + 1}</span>
              <span className="score-name">{p.zodiac} {p.name}</span>
              <span className="score-points">{p.score} 🪙</span>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="small">all-time top 5 🏆</p>
          {hall.length === 0 && <p className="small">no entries yet</p>}
          {hall.map((h, idx) => (
            <div key={h.id} className="score-row">
              <span className="score-rank">#{idx + 1}</span>
              <span className="score-name">{h.zodiac} {h.name}</span>
              <span className="score-points">{h.score} 🪙</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button className="btn" type="button" onClick={playAgain}>
            play again 🔄
          </button>
        )}
        <button className="btn outline" type="button" onClick={leave}>
          leave 👋
        </button>
      </div>
    </main>
  )
}

export default Leaderboard
