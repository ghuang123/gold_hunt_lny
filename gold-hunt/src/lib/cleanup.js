import { supabase } from './supabase'

export const cleanup = async () => {
  await supabase
    .from('rooms')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { data: fame } = await supabase
    .from('hall_of_fame')
    .select('id, score')
    .order('score', { ascending: false })

  if (fame && fame.length > 10) {
    const toDelete = fame.slice(10).map((r) => r.id)
    await supabase.from('hall_of_fame').delete().in('id', toDelete)
  }
}
