export type Intent =
  | 'identify_player'
  | 'identify_dm'
  | 'ask_character'
  | 'ask_relationship'
  | 'ask_benefits'
  | 'ask_affinity'
  | 'ask_location'
  | 'ask_lore'
  | 'search_npcs'
  | 'search_locations'
  | 'ask_recommendation'
  | 'recommend_npcs'
  | 'feedback_recommendation'
  | 'increase_affinity'
  | 'ask_memory'
  | 'ask_quests'
  | 'ask_faction'
  | 'ask_map'
  | 'describe_self'
  | 'chat'
  | 'greeting'
  | 'farewell'
  | 'help'
  | 'unknown'

export interface Slots {
  characterName?: string
  locationName?: string
  topic?: string
  affinityTarget?: string
  feedbackSentiment?: 'positive' | 'negative'
  requestedFields?: string[]
  relationshipTarget?: string
  playerName?: string
}

export type Complexity = 'simple' | 'complex' | 'multistep'

export interface IntentClassification {
  intent: Intent
  slots: Partial<Slots>
  confidence: number
  complexity: Complexity
  requiresRetrieval: boolean
}

export const MULTISTEP_INTENTS: Intent[] = [
  'ask_lore',
  'ask_quests',
  'ask_faction',
  'ask_map',
  'describe_self',
]

export function getSystemPrompt(): string {
  return `You are an intent classifier for the Valkária RPG chatbot.

Classify the user message into one of these 24 intents and extract relevant slots.
Output ONLY valid JSON matching the schema below. No preamble, no explanation.

INTENTS:
identify_player, identify_dm, ask_character, ask_relationship, ask_benefits,
ask_affinity, ask_location, ask_lore, search_npcs, search_locations,
ask_recommendation, recommend_npcs, feedback_recommendation, increase_affinity,
ask_memory, ask_quests, ask_faction, ask_map, describe_self,
chat, greeting, farewell, help, unknown

SLOTS to extract when present:
- characterName: NPC name mentioned
- locationName: location mentioned
- topic: general topic
- affinityTarget: NPC name for affinity queries
- feedbackSentiment: "positive" | "negative" for feedback
- requestedFields: array of fields requested
- relationshipTarget: NPC name for relationship queries
- playerName: player name for identity

OUTPUT SCHEMA:
{
  "intent": "<one of the 24 intents>",
  "slots": { <extracted slots> },
  "confidence": <0.0-1.0>,
  "complexity": "simple" | "complex" | "multistep",
  "requiresRetrieval": true | false
}

complexity rules:
- simple: single entity lookup, direct answer
- complex: multiple sources needed, relationships
- multistep: requires planning across 3+ data sources`
}

export function getUserPromptTemplate(message: string, context?: string): string {
  return `${context ? `Session context: ${context}\n` : ''}Message: ${message}`
}
