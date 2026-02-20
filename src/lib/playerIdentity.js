export const ensurePlayerId = () => {
  let id = localStorage.getItem('gold_hunt_player_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('gold_hunt_player_id', id)
  }
  return id
}

export const getPlayerIdentity = () => {
  return {
    id: ensurePlayerId(),
    name: localStorage.getItem('gold_hunt_name') || '',
    zodiac: localStorage.getItem('gold_hunt_zodiac') || '',
  }
}

export const setPlayerIdentity = ({ name, zodiac }) => {
  localStorage.setItem('gold_hunt_name', name)
  localStorage.setItem('gold_hunt_zodiac', zodiac)
}
