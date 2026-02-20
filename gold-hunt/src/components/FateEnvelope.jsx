import { useState } from 'react'

function FateEnvelope({ fateIsTruth, compact = false }) {
  const [revealed, setRevealed] = useState(false)

  const label = fateIsTruth ? 'truth 🍵' : 'lie 🧨'
  const caption = revealed ? 'tap to hide' : 'tap to reveal'

  return (
    <button
      type="button"
      className={`hongbao ${compact ? 'compact' : ''}`}
      onClick={() => setRevealed((v) => !v)}
      aria-pressed={revealed}
    >
      <div className="hongbao-orb" />
      <div className="hongbao-title">{caption}</div>
      <div className="hongbao-sub">{revealed ? label : 'keep it hidden'}</div>
    </button>
  )
}

export default FateEnvelope
