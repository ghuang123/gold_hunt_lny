import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cleanup } from '../lib/cleanup'
import { generateCode } from '../lib/roomCodes'
import { ZODIACS } from '../lib/zodiacs'
import { ensurePlayerId, getPlayerIdentity, setPlayerIdentity } from '../lib/playerIdentity'

function Courtyard() {
  const navigate = useNavigate()
  const initial = getPlayerIdentity()
  const [name, setName] = useState(initial.name)
  const [zodiac, setZodiac] = useState(initial.zodiac)
  const [draftName, setDraftName] = useState(initial.name)
  const [draftZodiac, setDraftZodiac] = useState(initial.zodiac)
  const [editing, setEditing] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [liveRooms, setLiveRooms] = useState([])
  const [rejoinRoom, setRejoinRoom] = useState(null)

  useEffect(() => {
    ensurePlayerId()
  }, [])

  useEffect(() => {
    const checkRejoin = async () => {
      const id = localStorage.getItem('gold_hunt_player_id')
      if (!id) return
      const { data } = await supabase
        .from('players')
        .select('room_code, is_active')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      if (data?.room_code) setRejoinRoom(data.room_code)
    }
    checkRejoin()
  }, [])

  useEffect(() => {
    const loadRooms = async () => {
      const { data: rooms } = await supabase
        .from('rooms')
        .select('code')
        .eq('status', 'LOBBY')
      const codes = (rooms || []).map((r) => r.code)
      if (codes.length === 0) {
        setLiveRooms([])
        return
      }
      const { data: players } = await supabase
        .from('players')
        .select('room_code')
        .in('room_code', codes)
        .eq('is_active', true)
      const counts = (players || []).reduce((acc, p) => {
        acc[p.room_code] = (acc[p.room_code] || 0) + 1
        return acc
      }, {})
      const withCounts = codes
        .map((c) => ({ code: c, count: counts[c] || 0 }))
        .filter((r) => r.count > 0)
      setLiveRooms(withCounts)
    }
    loadRooms()
    const t = setInterval(loadRooms, 5000)
    return () => clearInterval(t)
  }, [])

  const canSave = useMemo(() => draftName.trim().length > 0 && draftZodiac, [draftName, draftZodiac])

  const saveIdentity = () => {
    if (!canSave) return
    setPlayerIdentity({ name: draftName.trim(), zodiac: draftZodiac })
    setName(draftName.trim())
    setZodiac(draftZodiac)
    setEditing(false)
  }

  const createRoom = async () => {
    setError('')
    const id = ensurePlayerId()
    if (!name || !zodiac) {
      setError('set your name and zodiac first')
      return
    }
    await cleanup()
    const code = await generateCode()
    const { error: roomErr } = await supabase.from('rooms').insert({ code })
    if (roomErr) {
      setError('room creation failed')
      return
    }
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (existing?.id) {
      const { error: updateErr } = await supabase.from('players').update({
        room_code: code,
        name,
        zodiac,
        is_host: true,
        is_active: true,
        score: 0,
        score_delta: 0,
        has_played_turn: false,
        turn_order: null,
        joined_at: new Date().toISOString(),
      }).eq('id', id)
      if (updateErr) {
        setError('could not join room')
        return
      }
    } else {
      const { error: playerErr } = await supabase.from('players').insert({
        id,
        room_code: code,
        name,
        zodiac,
        is_host: true,
        is_active: true,
        score: 0,
        score_delta: 0,
        has_played_turn: false,
        turn_order: null,
        joined_at: new Date().toISOString(),
      })
      if (playerErr) {
        setError('could not join room')
        return
      }
    }
    navigate(`/room/${code}`)
  }

  const joinRoom = async () => {
    setError('')
    const code = roomCode.trim().toUpperCase()
    if (code.length < 4) return
    if (!name || !zodiac) {
      setError('set your name and zodiac first')
      return
    }
    const id = ensurePlayerId()
    const { data: existingAny } = await supabase
      .from('players')
      .select('id, room_code')
      .eq('id', id)
      .maybeSingle()
    if (existingAny?.room_code === code) {
      await supabase.from('players').update({ is_active: true }).eq('id', id)
      navigate(`/room/${code}`)
      return
    }
    const { data: room } = await supabase
      .from('rooms')
      .select('code, status')
      .eq('code', code)
      .single()
    if (!room) {
      setError('room not found')
      return
    }
    if (room.status !== 'LOBBY') {
      setError('game already started — try the code to rejoin 👀')
      return
    }
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('room_code', code)
      .eq('is_active', true)
    if ((players || []).length >= 8) {
      setError('room is full (8/8), sorry bestie')
      return
    }
    if (existingAny?.id) {
      const { error: moveErr } = await supabase.from('players').update({
        room_code: code,
        name,
        zodiac,
        is_host: false,
        is_active: true,
        score: 0,
        score_delta: 0,
        has_played_turn: false,
        turn_order: null,
        joined_at: new Date().toISOString(),
      }).eq('id', id)
      if (moveErr) {
        setError('could not join room')
        return
      }
    } else {
      const { error: joinErr } = await supabase.from('players').insert({
        id,
        room_code: code,
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
      if (joinErr) {
        setError('could not join room')
        return
      }
    }
    navigate(`/room/${code}`)
  }

  return (
    <main className="screen courtyard">
      <div className="lantern lantern-1" />
      <div className="lantern lantern-2" />
      <div className="lantern lantern-3" />

      <div className="stack">
        <div className="card row between">
          <div>
            <p className="small">playing as:</p>
            <p>{zodiac} {name}</p>
          </div>
          <button
            className="link"
            type="button"
            onClick={() => {
              if (!editing) {
                setDraftName(name)
                setDraftZodiac(zodiac)
              }
              setEditing((v) => !v)
            }}
          >
            edit ✏️
          </button>
        </div>

        {editing && (
          <div className="card">
            <input
              className="input gold-input"
              placeholder="your name..."
              maxLength={12}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
            <div className="zodiac-grid">
              {ZODIACS.map((z) => (
                <button
                  key={z.emoji}
                  type="button"
                  className={`zodiac-card ${draftZodiac === z.emoji ? 'selected' : ''}`}
                  onClick={() => setDraftZodiac(z.emoji)}
                >
                  <span className="emoji">{z.emoji}</span>
                  <span className="name">{z.name}</span>
                  <span className="trait">{z.trait}</span>
                </button>
              ))}
            </div>
            <button className="btn" type="button" disabled={!canSave} onClick={saveIdentity}>
              save →
            </button>
          </div>
        )}

        <h2>the courtyard</h2>

        {rejoinRoom && (
          <button className="btn" type="button" onClick={() => navigate(`/room/${rejoinRoom}`)}>
            you're still in room {rejoinRoom} — rejoin? →
          </button>
        )}

        <button className="btn" type="button" onClick={createRoom}>
          start a room 🐴
        </button>

        <div className="row">
          <input
            className="input gold-input grow"
            placeholder="room code"
            maxLength={5}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          />
          <button className="btn join" type="button" onClick={joinRoom}>
            join →
          </button>
        </div>

        {error && <p className="small">{error}</p>}

        <div className="card">
          <p className="small">live rooms</p>
          {liveRooms.length === 0 && <p className="small">no open rooms rn. start one? 👀</p>}
          {liveRooms.map((r) => (
            <button
              key={r.code}
              type="button"
              className="room-row"
              onClick={() => setRoomCode(r.code)}
            >
              <span className="room-code">{r.code}</span>
              <span className="room-count">{r.count} players waiting</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

export default Courtyard
