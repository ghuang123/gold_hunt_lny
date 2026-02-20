import { supabase } from './supabase'

export const startGame = async (roomCode, hostId) => {
  const { error } = await supabase.rpc('start_game', {
    p_room_code: roomCode,
    p_host_id: hostId,
  })
  if (error) throw new Error(error.message)
}
