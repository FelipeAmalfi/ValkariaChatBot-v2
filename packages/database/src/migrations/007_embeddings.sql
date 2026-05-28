CREATE TABLE IF NOT EXISTS langchain_pg_embedding (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID,
  embedding vector(1536),
  document TEXT,
  cmetadata JSONB DEFAULT '{}',
  custom_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_embedding_vector
  ON langchain_pg_embedding USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
