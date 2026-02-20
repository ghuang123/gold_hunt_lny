import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRemainingSeconds } from '../lib/time'
import { VOTING_PROMPTS } from '../lib/copy'

function VotePhase({ room, players, myId, onAllVoted, onTimeout }) {
  const [votes, setVotes] = useState([])
  const [, setTick] = useState(0)
  const [prompt] = useState(() => VOTING_PROMPTS[Math.floor(Math.random() * VOTING_PROMPTS.length)])

  const activePlayers = useMemo(
    () => players.filter((p) => p.is_active),
    [players]
  )
  const isSpeaker = room.current_player_id === myId
  const requiredVotes = Math.max(0, activePlayers.length - 1)
  const myVote = votes.find((v) => v.voter_id === myId)

  useEffect(() => {
    const loadVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('room_code', room.code)
      setVotes(data || [])
    }
    loadVotes()

    const channel = supabase
      .channel(`votes:${room.code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_code=eq.${room.code}` }, async () => {
        const { data } = await supabase
          .from('votes')
          .select('*')
          .eq('room_code', room.code)
        setVotes(data || [])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.code])

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 250)
    return () => clearInterval(t)
  }, [])

  const remaining = getRemainingSeconds(room.voting_started_at, 30)

  const elapsed = 30 - remaining
  const speedLabel = elapsed < 10 ? '⚡ +50 if you vote now' : elapsed < 20 ? '+25 if you vote now' : 'no bonus — still worth it'

  useEffect(() => {
    if (!isSpeaker) return
    if (requiredVotes > 0 && votes.length >= requiredVotes) {
      onAllVoted()
    }
    if (requiredVotes === 0 && votes.length === 0) {
      onAllVoted()
    }
  }, [votes.length, requiredVotes, isSpeaker, onAllVoted])

  useEffect(() => {
    if (!isSpeaker) return
    if (remaining <= 0) onTimeout()
  }, [remaining, isSpeaker, onTimeout])

  const vote = async (guess) => {
    if (isSpeaker) return
    if (myVote) return
    await supabase.from('votes').insert({
      room_code: room.code,
      voter_id: myId,
      guess_is_truth: guess,
    })
  }

  const speaker = activePlayers.find((p) => p.id === room.current_player_id)

  if (isSpeaker) {
    return (
      <main className="screen">
        <div className="stack">
          <h2>the table is deciding your fate...</h2>
          <p className="small">{votes.length} of {requiredVotes} have voted</p>
        </div>
      </main>
    )
  }

  return (
    <main className="screen">
      <div className="stack">
        <h2>{prompt}</h2>
        <p className="small">{speaker?.name} was answering: {room.chosen_question}</p>

        <div className="card speed-card">
          <p className="small">⚡ vote faster = more gold</p>
          <div className={`speed-row ${elapsed < 10 ? 'active' : ''}`}>within 10 seconds → +50 (150 🪙)</div>
          <div className={`speed-row ${elapsed >= 10 && elapsed < 20 ? 'active' : ''}`}>10 to 20 seconds → +25 (125 🪙)</div>
          <div className={`speed-row ${elapsed >= 20 ? 'active' : ''}`}>after 20 seconds → +0 (100 🪙)</div>
          <div className="speed-row">wrong vote → +0 (speaker gets your gold instead)</div>
        </div>

        <div className="badge-line">{speedLabel}</div>

        <div className="vote-grid">
          <button
            className={`vote-btn truth ${myVote ? 'locked' : ''} ${myVote?.guess_is_truth === true ? 'selected' : ''}`}
            type="button"
            onClick={() => vote(true)}
            disabled={!!myVote}
          >
            truth 🍵 {myVote?.guess_is_truth === true ? '✓' : ''}
          </button>
          <button
            className={`vote-btn lie ${myVote ? 'locked' : ''} ${myVote?.guess_is_truth === false ? 'selected' : ''}`}
            type="button"
            onClick={() => vote(false)}
            disabled={!!myVote}
          >
            lie 🧨 {myVote?.guess_is_truth === false ? '✓' : ''}
          </button>
        </div>
      </div>
    </main>
  )
}

export default VotePhase
