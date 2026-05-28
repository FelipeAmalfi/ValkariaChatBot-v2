export const modelConfig = {
  chat: {
    model: process.env.AI_CHAT_MODEL ?? 'mistralai/mistral-7b-instruct:free',
    temperature: 0.7,
    maxTokens: 1024,
  },
  classification: {
    model: process.env.AI_CLASSIFICATION_MODEL ?? 'mistralai/mistral-7b-instruct:free',
    temperature: 0.1,
    maxTokens: 512,
  },
  cypher: {
    model: process.env.AI_CYPHER_MODEL ?? 'mistralai/mistral-7b-instruct:free',
    temperature: 0.2,
    maxTokens: 1024,
  },
  plan: {
    model: process.env.AI_PLAN_MODEL ?? 'mistralai/mistral-7b-instruct:free',
    temperature: 0.2,
    maxTokens: 512,
  },
  embedding: {
    model: process.env.AI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    dimensions: Number(process.env.AI_EMBEDDING_DIMENSIONS ?? 1536),
  },
  fallback: {
    model: process.env.AI_FALLBACK_MODEL ?? 'google/gemma-3-1b-it:free',
    temperature: 0.7,
    maxTokens: 512,
  },
}
