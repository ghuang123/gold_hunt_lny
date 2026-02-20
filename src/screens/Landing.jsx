import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ZODIACS } from '../lib/zodiacs'
import { setPlayerIdentity, getPlayerIdentity } from '../lib/playerIdentity'

function Landing() {
  const navigate = useNavigate()
  const initial = getPlayerIdentity()
  const [name, setName] = useState(initial.name)
  const [zodiac, setZodiac] = useState(initial.zodiac)

  const canContinue = useMemo(() => name.trim().length > 0 && zodiac, [name, zodiac])

  const onContinue = () => {
    setPlayerIdentity({ name: name.trim(), zodiac })
    navigate('/courtyard')
  }

  return (
    <main className="screen landing">
      <div className="lantern lantern-1" />
      <div className="lantern lantern-2" />
      <div className="lantern lantern-3 hide-sm" />

      <div className="stack items-center">
        <h1>gold hunt</h1>
        <p className="text-base">year of the fire horse 🐴🔥</p>
        <p className="small">once every 60 years.</p>
        <p className="small">speed. deception. fortune.</p>

        <input
          className="input gold-input"
          placeholder="your name..."
          maxLength={12}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="zodiac-grid">
          {ZODIACS.map((z) => (
            <button
              key={z.emoji}
              type="button"
              className={`zodiac-card ${zodiac === z.emoji ? 'selected' : ''}`}
              onClick={() => setZodiac(z.emoji)}
            >
              <span className="emoji">{z.emoji}</span>
              <span className="name">{z.name}</span>
              <span className="trait">{z.trait}</span>
            </button>
          ))}
        </div>

        <button className="btn soft" type="button" disabled={!canContinue} onClick={onContinue}>
          enter the courtyard →
        </button>

        <div className="card howto">
          <p className="small">once every 60 years. 🐴🔥</p>
          <p>the fire horse (bǐng wǔ) comes around once every 60 years. the last one was 1966. it's the most magnetic, chaotic, high-energy sign in the chinese zodiac — and in this room, it decides who gets the gold. the fire horse punishes hesitation. it rewards the bold.</p>

          <div className="divider">---</div>

          <p className="small">speak. survive. (maybe) deceive.</p>
          <p>🧧 fate — you'll see your truth/lie + two questions. pick one. own it.</p>
          <p>🍵 truth — tell a real story. don't be obvious.</p>
          <p>🧨 lie — make it believable. eye contact. no hesitation. commit.</p>
          <p>🔥 the hunt — the room interrogates you after you speak.</p>
          <p>🗳 the vote — truth or lie? faster = more gold.</p>

          <div className="divider">---</div>

          <p className="small">speed wins. hesitation costs. 🪙</p>
          <p>within 10s → +50 (150 🪙)</p>
          <p>10–20s → +25 (125 🪙)</p>
          <p>after 20s → +0 (100 🪙)</p>
          <p>wrong vote → +0</p>
          <p>speaker fools someone: +200 🪙 per wrong vote</p>
          <p>speaker fools everyone: +200 🪙 bonus on top</p>
          <p>getting caught by everyone: +0. the shame is the punishment.</p>
          <p className="small">the fire horse rewards whoever trusts their gut. staring at the ceiling for 25 seconds before voting? that's a snake move.</p>

          <div className="divider">---</div>

          <p className="small">quick ref</p>
          <p>chosen 🎯 — tap when ready — your pace</p>
          <p>fate 🧧 — pick your question — your pace</p>
          <p>campfire 🍵 — answer it — 45s</p>
          <p>hunt 🔥 — defend yourself — 45s + bonus</p>
          <p>vote 🗳 — trust or cap — 30s</p>
          <p>reveal ✨ — find out — auto</p>
          <p className="small">"speed. clarity. no second chances."</p>
        </div>
      </div>
    </main>
  )
}

export default Landing
