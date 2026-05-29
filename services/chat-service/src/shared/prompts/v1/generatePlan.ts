import type { Slots } from './identifyIntent.js'

export interface PlannerStep {
  strategy: 'vector' | 'affinity' | 'character_lookup' | 'memory'
  target: string
  filters?: Record<string, string>
  purpose: string
}

export interface PlannerPlan {
  steps: PlannerStep[]
}

export function getSystemPrompt(): string {
  return `Você é um planejador de recuperação de contexto para um chatbot RPG chamado Valkária.

Seu objetivo é criar um plano de recuperação em etapas para responder à mensagem do jogador.

Estratégias disponíveis:
- vector: busca semântica em textos de lore
- affinity: dados de relacionamento do jogador com NPCs
- character_lookup: busca direta de NPC no banco de dados
- memory: memória de sessão do jogador

Regras:
- Máximo de 4 etapas
- Sem estratégias duplicadas
- Responda apenas com JSON válido, sem markdown

Formato de resposta:
{
  "steps": [
    { "strategy": "character_lookup", "target": "NomeDoNPC", "purpose": "Obter descrição do NPC" },
    { "strategy": "affinity", "target": "NomeDoNPC", "purpose": "Verificar nível de relacionamento" }
  ]
}`
}

export function getUserPromptTemplate(
  intent: string,
  slots: Partial<Slots>,
  message: string,
): string {
  return `Intent detectada: ${intent}
Slots extraídos: ${JSON.stringify(slots)}
Mensagem do jogador: ${message}

Crie um plano de recuperação para responder à pergunta do jogador.`
}

export function parsePlanResponse(content: string): PlannerPlan {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { steps: [] }
    const parsed = JSON.parse(jsonMatch[0]) as PlannerPlan
    if (!Array.isArray(parsed.steps)) return { steps: [] }
    return parsed
  } catch {
    return { steps: [] }
  }
}
