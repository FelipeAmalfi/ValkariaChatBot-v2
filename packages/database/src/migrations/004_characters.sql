CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  role VARCHAR(50) DEFAULT 'npc',
  faction VARCHAR(100) DEFAULT 'neutral',
  location_id UUID REFERENCES locations(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_name ON characters (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_characters_faction ON characters (faction);
