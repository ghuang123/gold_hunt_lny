import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { startGame as startGameRpc } from '../lib/startGame'
import ChosenPhase from './ChosenPhase.jsx'
import FatePhase from './FatePhase.jsx'
import CampfirePhase from './CampfirePhase.jsx'
import HuntPhase from './HuntPhase.jsx'
import VotePhase from './VotePhase.jsx'
import ResultPhase from './ResultPhase.jsx'
import Leaderboard from './Leaderboard.jsx'
import QANav from '../components/QANav.jsx'
import QAPanel from '../components/QAPanel.jsx'

const PHASES = ['CHOSEN', 'FATE', 'CAMPFIRE', 'HUNT', 'VOTING', 'RESULT', 'LEADERBOARD']

function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const myId = useMemo(() => localStorage.getItem('gold_hunt_player_id'), [])
  const myName = useMemo(() => (localStorage.getItem('gold_hunt_name') || '').trim().toLowerCase(), [])
  const isQa = myName === 'gracehuangqa'
  const me = useMemo(() => players.find((p) => p.id === myId), [players, myId])
  const isHost = me?.is_host

  useEffect(() => {
    const load = async () => {
      const { data: r } = await supabase.from('rooms').select('*').eq('code', code).single()
      if (!r) {
        setError('room not found')
        return
      }
      setRoom(r)
      const { data: p } = await supabase.from('players').select('*').eq('room_code', code)
      setPlayers(p || [])
    }
    load()
  }, [code])

  useEffect(() => {
    const roomChannel = supabase
      .channel(`rooms:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, (payload) => {
        setRoom(payload.new)
      })
      .subscribe()

    const playersChannel = supabase
      .channel(`players:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${code}` }, async () => {
        const { data: p } = await supabase.from('players').select('*').eq('room_code', code)
        setPlayers(p || [])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(playersChannel)
    }
  }, [code])

  const startGame = async () => {
    if (!isHost) return
    if (!isQa && players.filter((p) => p.is_active).length < 2) return
    setActionError('')
    try {
      await startGameRpc(code, myId)
    } catch (e) {
      setActionError(e.message)
    }
  }

  const kickPlayer = async (id) => {
    if (!isHost) return
    await supabase.from('players').update({ is_active: false }).eq('id', id)
  }

  const goToFate = async () => {
    if (room?.game_phase !== 'CHOSEN') return
    await supabase.from('rooms').update({ game_phase: 'FATE' }).eq('code', code)
  }

  const startStory = async (selected) => {
    if (room?.game_phase !== 'FATE') return
    await supabase.from('rooms').update({
      chosen_question: selected,
      chosen_topic: room.current_topic,
      game_phase: 'CAMPFIRE',
      campfire_started_at: new Date().toISOString(),
      accumulated_pause_ms: 0,
      timer_paused_at: null,
    }).eq('code', code)
  }

  const doneTalking = async (bonus) => {
    if (room?.game_phase !== 'CAMPFIRE') return
    await supabase.from('rooms').update({
      hunt_bonus_time: bonus,
      game_phase: 'HUNT',
      hunt_started_at: new Date().toISOString(),
    }).eq('code', code)
  }

  const campfireTimeout = async () => {
    if (room?.game_phase !== 'CAMPFIRE') return
    await supabase.from('rooms').update({
      hunt_bonus_time: 0,
      game_phase: 'HUNT',
      hunt_started_at: new Date().toISOString(),
    }).eq('code', code)
  }

  const huntTimeout = async () => {
    if (room?.game_phase !== 'HUNT') return
    await supabase.from('rooms').update({
      game_phase: 'VOTING',
      voting_started_at: new Date().toISOString(),
    }).eq('code', code)
    await supabase.from('votes').delete().eq('room_code', code)
  }

  const voteTimeout = async () => {
    if (room?.game_phase !== 'VOTING') return
    await supabase.from('rooms').update({
      game_phase: 'RESULT',
      result_processed_at: null,
    }).eq('code', code)
  }

  const qaMove = async (dir) => {
    if (!isHost || room?.status !== 'PLAYING') return
    const idx = PHASES.indexOf(room.game_phase)
    if (idx === -1) return
    const next = PHASES[Math.min(PHASES.length - 1, Math.max(0, idx + dir))]
    const update = { game_phase: next }
    const now = new Date().toISOString()

    if (next === 'CAMPFIRE') update.campfire_started_at = now
    if (next === 'HUNT') update.hunt_started_at = now
    if (next === 'VOTING') update.voting_started_at = now
    if (next === 'RESULT') update.result_processed_at = null

    await supabase.from('rooms').update(update).eq('code', code)
  }

  if (error) {
    return (
      <main className="screen">
        <h2>{error}</h2>
        <button className="btn" type="button" onClick={() => navigate('/courtyard')}>
          back to courtyard
        </button>
      </main>
    )
  }

  if (!room) {
    return (
      <main className="screen">
        <p className="small">loading room...</p>
      </main>
    )
  }

  if (room.status === 'LOBBY') {
    const activePlayers = players.filter((p) => p.is_active)
    return (
      <main className="screen">
        <QANav disabled />
        <h2>{room.code}</h2>
        <p className="hint">share this code with your people</p>
        <p className="hint">{activePlayers.length}/8 players</p>

        <div className="player-list">
          {activePlayers.map((p) => (
            <div key={p.id} className={`player-row ${p.is_host ? 'host-row' : ''}`}>
              <span>{p.zodiac} {p.name}</span>
              <div className="player-actions">
                {p.is_host && <span className="badge host-badge">host</span>}
                {isHost && !p.is_host && (
                  <button className="btn outline small-btn" type="button" onClick={() => kickPlayer(p.id)}>
                    remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {actionError && <div className="error-card">{actionError}</div>}

        {isHost ? (
          <button className="btn primary-cta" type="button" disabled={!isQa && activePlayers.length < 2} onClick={startGame}>
            light the fire 🔥
          </button>
        ) : (
          <p className="small">waiting for host to light the fire... 🕯️</p>
        )}

        <button className="btn outline" type="button" onClick={() => navigate('/courtyard')}>
          ← back
        </button>
      </main>
    )
  }

  return (
    <>
      <QANav disabled={!isHost} onBack={() => qaMove(-1)} onNext={() => qaMove(1)} />
      <QAPanel room={room} players={players} isHost={isHost} isQa={isQa} />

      {room.game_phase === 'CHOSEN' && (
        <ChosenPhase room={room} players={players} myId={myId} onReady={goToFate} />
      )}

      {room.game_phase === 'FATE' && (
        <FatePhase room={room} players={players} myId={myId} onStartStory={startStory} />
      )}

      {room.game_phase === 'CAMPFIRE' && (
        <CampfirePhase
          room={room}
          players={players}
          myId={myId}
          onDoneTalking={doneTalking}
          onTimeout={campfireTimeout}
        />
      )}

      {room.game_phase === 'HUNT' && (
        <HuntPhase
          room={room}
          players={players}
          myId={myId}
          onTimeout={huntTimeout}
        />
      )}

      {room.game_phase === 'VOTING' && (
        <VotePhase
          room={room}
          players={players}
          myId={myId}
          onAllVoted={voteTimeout}
          onTimeout={voteTimeout}
        />
      )}

      {room.game_phase === 'RESULT' && (
        <ResultPhase room={room} players={players} isHost={isHost} />
      )}

      {room.game_phase === 'LEADERBOARD' && (
        <Leaderboard room={room} players={players} isHost={isHost} />
      )}
    </>
  )
}

export default Room
