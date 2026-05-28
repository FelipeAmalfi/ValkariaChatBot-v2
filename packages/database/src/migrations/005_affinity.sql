CREATE TABLE IF NOT EXISTS npc_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc_name VARCHAR(255) NOT NULL,
  level VARCHAR(20) DEFAULT 'none',
  score FLOAT DEFAULT 0,
  interaction_count INT DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  UNIQUE(player_id, npc_name)
);

CREATE TABLE IF NOT EXISTS interaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc_name VARCHAR(255),
  location_name VARCHAR(255),
  intent VARCHAR(100),
  sentiment VARCHAR(50),
  message_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc_name VARCHAR(255) NOT NULL,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
