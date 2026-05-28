CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  class VARCHAR(100) NOT NULL,
  race VARCHAR(100) NOT NULL,
  background TEXT NOT NULL,
  personality TEXT NOT NULL,
  interests TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_name ON players (LOWER(name));

CREATE TABLE IF NOT EXISTS player_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  embedding vector(1536),
  drift_alpha FLOAT DEFAULT 0.15,
  interaction_count INT DEFAULT 0
);
