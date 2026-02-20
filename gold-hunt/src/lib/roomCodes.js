import { supabase } from './supabase'

export const ROOM_CODES = [
  'JADE', 'GOLD', 'LION', 'FIRE', 'YEAR', 'COIN', 'LUCK', 'MOON',
  'DRUM', 'WISH', 'GIFT', 'GLOW', 'HOPE', 'KITE', 'LAMP', 'LEAP',
  'SILK', 'SONG', 'STAR', 'TIDE', 'WAVE', 'WIND', 'BOLD', 'DAWN',
  'DUSK', 'EAST', 'FATE', 'FISH', 'HARE', 'HUNT', 'MIST', 'OATH',
  'PACE', 'RACE', 'RICE', 'ROSE', 'RUSH', 'SAGE', 'VINE', 'ZEST'
]

export const generateCode = async () => {
  const { data: rooms } = await supabase.from('rooms').select('code')
  const used = new Set((rooms || []).map((r) => r.code))

  const baseAvailable = ROOM_CODES.filter((c) => !used.has(c))
  if (baseAvailable.length > 0) {
    return baseAvailable[Math.floor(Math.random() * baseAvailable.length)]
  }

  for (const base of ROOM_CODES) {
    for (let n = 2; n <= 5; n++) {
      const code = `${base}${n}`
      if (!used.has(code)) return code
    }
  }

  throw new Error('could not generate room code')
}
