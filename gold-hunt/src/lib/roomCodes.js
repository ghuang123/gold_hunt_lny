import { supabase } from './supabase'

export const ROOM_CODES = [
  'JADE', 'GOLD', 'LION', 'FIRE', 'YEAR', 'COIN', 'LUCK', 'MOON',
  'DRUM', 'WISH', 'GIFT', 'GLOW', 'HOPE', 'KITE', 'LAMP', 'LEAP',
  'SILK', 'SONG', 'STAR', 'TIDE', 'WAVE', 'WIND', 'BOLD', 'DAWN',
  'DUSK', 'EAST', 'FATE', 'FISH', 'HARE', 'HUNT', 'MIST', 'OATH',
  'PACE', 'RACE', 'RICE', 'ROSE', 'RUSH', 'SAGE', 'VINE', 'ZEST'
]

export const generateCode = async () => {
  for (let i = 0; i < ROOM_CODES.length; i++) {
    const base = ROOM_CODES[i]
    for (let n = 1; n <= 5; n++) {
      const code = n === 1 ? base : `${base}${n}`
      const { data } = await supabase
        .from('rooms')
        .select('code')
        .eq('code', code)
        .single()
      if (!data) return code
    }
  }
  throw new Error('could not generate room code')
}
