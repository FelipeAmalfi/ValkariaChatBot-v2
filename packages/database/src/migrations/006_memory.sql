CREATE TABLE IF NOT EXISTS memory_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(255) UNIQUE NOT NULL,
  player_id UUID REFERENCES players(id),
  summary TEXT,
  turn_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
