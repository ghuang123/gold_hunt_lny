CREATE OR REPLACE FUNCTION start_game(p_room_code TEXT, p_host_id UUID)
RETURNS void AS $$
DECLARE
  v_current_player_id UUID;
  v_topic TEXT;
  v_q1 TEXT;
  v_q2 TEXT;
BEGIN
  -- lock room row
  PERFORM 1 FROM rooms WHERE code = p_room_code FOR UPDATE;

  -- ensure host is valid
  IF NOT EXISTS (
    SELECT 1 FROM players
    WHERE room_code = p_room_code
      AND id = p_host_id
      AND is_host = true
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'host not authorized';
  END IF;

  -- only allow from lobby
  IF EXISTS (SELECT 1 FROM rooms WHERE code = p_room_code AND status <> 'LOBBY') THEN
    RAISE EXCEPTION 'room not in lobby';
  END IF;

  -- reset per-game flags
  UPDATE players
    SET has_played_turn = false,
        score_delta = 0
    WHERE room_code = p_room_code;

  -- assign random turn order
  WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY random()) AS rn
    FROM players
    WHERE room_code = p_room_code AND is_active = true
  )
  UPDATE players p
    SET turn_order = ordered.rn
    FROM ordered
    WHERE p.id = ordered.id;

  -- set current player
  SELECT id INTO v_current_player_id
    FROM players
    WHERE room_code = p_room_code AND is_active = true
    ORDER BY turn_order ASC
    LIMIT 1;

  -- pick topic and questions
  SELECT topic INTO v_topic
    FROM questions
    GROUP BY topic
    ORDER BY random()
    LIMIT 1;

  SELECT text INTO v_q1
    FROM questions
    WHERE topic = v_topic AND level = 'q1'
    LIMIT 1;

  SELECT text INTO v_q2
    FROM questions
    WHERE topic = v_topic AND level = 'q2'
    LIMIT 1;

  -- update room state
  UPDATE rooms SET
    status = 'PLAYING',
    game_phase = 'CHOSEN',
    current_player_id = v_current_player_id,
    fate_is_truth = (random() > 0.5),
    question_q1 = v_q1,
    question_q2 = v_q2,
    current_topic = v_topic,
    chosen_question = NULL,
    chosen_topic = NULL,
    hunt_bonus_time = 0,
    timer_paused_at = NULL,
    accumulated_pause_ms = 0,
    used_topics = ARRAY[v_topic]
  WHERE code = p_room_code;

  -- clear votes
  DELETE FROM votes WHERE room_code = p_room_code;
END;
$$ LANGUAGE plpgsql;
