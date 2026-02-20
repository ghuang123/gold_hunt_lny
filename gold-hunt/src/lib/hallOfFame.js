import { supabase } from './supabase'

export const updateHallOfFame = async (players, roomCode) => {
  const winner = [...players].sort((a, b) => b.score - a.score)[0]
  if (!winner) return

  const { data: existing } = await supabase
    .from('hall_of_fame')
    .select('id, score')
    .eq('room_code', roomCode)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing && winner.score <= existing.score) return

  const { data: lowest } = await supabase
    .from('hall_of_fame')
    .select('id, score')
    .order('score', { ascending: true })
    .limit(1)
    .single()

  const { count } = await supabase
    .from('hall_of_fame')
    .select('id', { count: 'exact', head: true })

  if (!count || count < 10 || winner.score > (lowest?.score ?? 0)) {
    if (existing?.id) {
      await supabase.from('hall_of_fame').update({
        name: winner.name,
        zodiac: winner.zodiac,
        score: winner.score,
      }).eq('id', existing.id)
    } else {
      await supabase.from('hall_of_fame').insert({
        name: winner.name,
        zodiac: winner.zodiac,
        score: winner.score,
        room_code: roomCode,
      })
    }
    const { data: fame } = await supabase
      .from('hall_of_fame')
      .select('id, score')
      .order('score', { ascending: false })
    if (fame && fame.length > 10) {
      const toDelete = fame.slice(10).map((r) => r.id)
      await supabase.from('hall_of_fame').delete().in('id', toDelete)
    }
  }
}
