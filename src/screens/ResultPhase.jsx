import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRandomTopicQuestions } from '../lib/questions'

function ResultPhase({ room, players, isHost }) {
  const [votes, setVotes] = useState([])
  const [votesLoaded, setVotesLoaded] = useState(false)
  const processedRef = useRef(false)

  useEffect(() => {
    const loadVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('room_code', room.code)
      setVotes(data || [])
      setVotesLoaded(true)
    }
    loadVotes()
  }, [room.code])

  const playerById = useMemo(() => {
    const map = {}
    players.forEach((p) => { map[p.id] = p })
    return map
  }, [players])

  const fateIsTruth = room.fate_is_truth
  const activeVoters = votes.filter((v) => v.voter_id !== room.current_player_id)
  const wrongVoters = activeVoters.filter((v) => v.guess_is_truth !== fateIsTruth)
  const fooledEveryone = wrongVoters.length === activeVoters.length && activeVoters.length > 0

  const speaker = playerById[room.current_player_id]

  const voteResults = activeVoters.map((v) => {
    const correct = v.guess_is_truth === fateIsTruth
    const ms = new Date(v.created_at) - new Date(room.voting_started_at)
    const bonus = correct ? (ms < 10000 ? 50 : ms < 20000 ? 25 : 0) : 0
    const delta = correct ? 100 + bonus : 0
    return { ...v, correct, bonus, delta, player: playerById[v.voter_id] }
  })

  useEffect(() => {
    const processResult = async () => {
      if (!isHost || processedRef.current) return
      if (!votesLoaded) return
      if (room.result_processed_at) return
      processedRef.current = true

      const { data: guard } = await supabase
        .from('rooms')
        .update({ result_processed_at: new Date().toISOString() })
        .eq('code', room.code)
        .is('result_processed_at', null)
        .select()

      if (!guard || guard.length === 0) return

      let speakerGold = 0
      const updates = []

      voteResults.forEach((r) => {
        if (r.correct) {
          updates.push({ id: r.voter_id, delta: r.delta })
        } else {
          speakerGold += 200
        }
      })

      if (fooledEveryone) speakerGold += 200
      updates.push({ id: room.current_player_id, delta: speakerGold })

      await supabase
        .from('players')
        .update({ score_delta: 0 })
        .eq('room_code', room.code)

      const currentPlayers = players
      await Promise.all(
        updates.map((u) => {
          const base = currentPlayers.find((p) => p.id === u.id)?.score || 0
          return supabase
            .from('players')
            .update({ score: base + u.delta, score_delta: u.delta })
            .eq('id', u.id)
        })
      )

      await supabase
        .from('players')
        .update({ has_played_turn: true })
        .eq('id', room.current_player_id)

      setTimeout(async () => {
        const { data: next } = await supabase
          .from('players')
          .select('id')
          .eq('room_code', room.code)
          .eq('has_played_turn', false)
          .eq('is_active', true)
          .order('turn_order', { ascending: true })
          .limit(1)
          .single()

        if (!next) {
          await supabase.from('rooms').update({ game_phase: 'LEADERBOARD' }).eq('code', room.code)
          return
        }

        const { topic, q1, q2 } = await getRandomTopicQuestions()

        await supabase.from('rooms').update({
          current_player_id: next.id,
          game_phase: 'CHOSEN',
          fate_is_truth: Math.random() > 0.5,
          question_q1: q1,
          question_q2: q2,
          current_topic: topic,
          chosen_question: null,
          chosen_topic: null,
          hunt_bonus_time: 0,
          timer_paused_at: null,
          accumulated_pause_ms: 0,
        }).eq('code', room.code)

        await supabase.from('votes').delete().eq('room_code', room.code)
      }, 2500)
    }

    processResult()
  }, [room, votes.length, votesLoaded, isHost, players, voteResults, fooledEveryone])

  const speakerGold = voteResults.reduce((sum, r) => sum + (r.correct ? 0 : 200), 0) + (fooledEveryone ? 200 : 0)

  return (
    <main className="screen result">
      <div className="stack">
        <h2>the verdict</h2>
        <p className="small">that was {fateIsTruth ? 'truth 🍵' : 'lie 🧨'}</p>

        {fooledEveryone && (
          <div className="card">
            <p className="small">🐴 fool's gold — {speaker?.name} fooled everyone! +200 bonus</p>
          </div>
        )}

        <div className="card">
          <p className="small">speaker</p>
          <p>{speaker?.zodiac} {speaker?.name} — +{speakerGold} 🪙</p>
        </div>

        <div className="card">
          <p className="small">votes</p>
          {voteResults.map((r) => (
            <div key={r.voter_id} className="score-row">
              <span className="score-name">{r.player?.zodiac} {r.player?.name}</span>
              <span className="score-delta">{r.correct ? '✅' : '❌'} +{r.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default ResultPhase
