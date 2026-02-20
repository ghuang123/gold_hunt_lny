import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ZODIACS } from '../lib/zodiacs'

function QAPanel({ room, players, isHost, isQa }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [mobileOn, setMobileOn] = useState(false)

  const activePlayers = useMemo(() => players.filter((p) => p.is_active), [players])

  const setNotice = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  const toggleMobile = () => {
    const next = !mobileOn
    setMobileOn(next)
    document.body.classList.toggle('qa-mobile', next)
  }

  const seedPlayers = async () => {
    if (!isHost || !isQa) return
    if (room.status !== 'LOBBY') {
      setNotice('seed only works in lobby')
      return
    }
    if (activePlayers.length >= 8) {
      setNotice('room already has 8 players')
      return
    }
    setBusy(true)
    const needed = 8 - activePlayers.length
    const usedNames = new Set(activePlayers.map((p) => p.name))
    const inserts = []
    let idx = 1
    while (inserts.length < needed) {
      const name = `qa${idx}`
      if (!usedNames.has(name)) {
        const zodiac = ZODIACS[inserts.length % ZODIACS.length]?.emoji || '🐴'
        inserts.push({
          id: crypto.randomUUID(),
          room_code: room.code,
          name,
          zodiac,
          is_host: false,
          is_active: true,
          score: 0,
          score_delta: 0,
          has_played_turn: false,
          turn_order: null,
          joined_at: new Date().toISOString(),
        })
      }
      idx += 1
      if (idx > 50) break
    }
    const { error } = await supabase.from('players').insert(inserts)
    if (error) {
      setNotice('seed failed')
    } else {
      setNotice('seeded to 8')
    }
    setBusy(false)
  }

  const seedVotes = async () => {
    if (!isHost || !isQa) return
    if (room.game_phase !== 'VOTING') {
      setNotice('seed votes only in voting')
      return
    }
    setBusy(true)
    const { data: existing } = await supabase
      .from('votes')
      .select('voter_id')
      .eq('room_code', room.code)
    const existingSet = new Set((existing || []).map((v) => v.voter_id))
    const voters = activePlayers.filter((p) => p.id !== room.current_player_id)
    const inserts = voters
      .filter((v) => !existingSet.has(v.id))
      .map((v) => ({
        room_code: room.code,
        voter_id: v.id,
        guess_is_truth: Math.random() > 0.5,
      }))
    if (inserts.length === 0) {
      setNotice('all votes already present')
      setBusy(false)
      return
    }
    const { error } = await supabase.from('votes').insert(inserts)
    if (error) {
      setNotice('vote seed failed')
    } else {
      setNotice('votes seeded')
    }
    setBusy(false)
  }

  const dbCheck = async () => {
    if (!isHost || !isQa) return
    setBusy(true)
    const { error } = await supabase
      .from('rooms')
      .select('current_topic, result_processed_at')
      .eq('code', room.code)
      .single()
    if (error) {
      setNotice('db check failed')
    } else {
      setNotice('db ok')
    }
    setBusy(false)
  }

  if (!isQa) return null

  return (
    <div className="qa-panel">
      <div className="qa-title">qa</div>
      <div className="qa-row">
        <button className="qa-panel-btn" type="button" disabled={!isHost || busy} onClick={seedPlayers}>
          seed 8
        </button>
        <button className="qa-panel-btn" type="button" disabled={!isHost || busy} onClick={seedVotes}>
          auto‑vote
        </button>
      </div>
      <div className="qa-row">
        <button className="qa-panel-btn" type="button" disabled={busy} onClick={dbCheck}>
          db check
        </button>
        <button className="qa-panel-btn" type="button" onClick={toggleMobile}>
          {mobileOn ? 'mobile off' : 'mobile on'}
        </button>
      </div>
      {message && <div className="qa-msg">{message}</div>}
    </div>
  )
}

export default QAPanel
