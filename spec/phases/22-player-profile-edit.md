# Phase 22 — Player Profile Edit

**Agent**: `full-stack`
**Depends on**: Phase 13, 16, 17
**Services**: `auth-service`, `services/world-service`, `apps/web`

---

## Objetivo

Criar uma página `/profile` editável para o jogador com três seções:

1. **Identidade** — avatar (upload de imagem) + campos narrativos editáveis (antecedente, personalidade, interesses)
2. **Tabela de Afinidades** — todos os NPCs do mundo com o nível atual de afinidade do jogador; dropdown para editar manualmente cada nível
3. **Salvar** — persiste no banco e atualiza o token JWT em memória

Campos de identidade imutáveis (apenas exibição): `name`, `class`, `race` — definidos no registro.

---

## Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Avatar storage | `auth-service` multipart → `/uploads/` | Sem infra externa; dev-local simples |
| Edição de info | `PATCH /auth/me` retorna novo JWT | Token fica sincronizado com DB |
| Edição de afinidade | mutation GraphQL `setAffinity` | world-service é dono do dado |
| Mapeamento level→score | none=0, cordial=13, loyal=50, intimate=88 | Centro de cada faixa do `scoreToLevel` |

---

## Mudanças de banco de dados

### Migration 008 — `avatar_url` em players

Arquivo: `packages/database/src/migrations/008_player_avatar.sql`

```sql
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);
```

A entidade `Player` e o `PgPlayerRepository` já suportam campos extras via `update()` parcial — só precisa mapear o novo campo.

---

## Auth-service — novos endpoints

### 1. `PATCH /auth/me` — atualizar dados do jogador

Request body: `{ background?, personality?, interests? }`

Comportamento:
- Extrai `playerId` do JWT via `request.jwtVerify()`
- Chama `playerRepository.update(playerId, fields)`
- Busca o player atualizado com `findById`
- Gera novo JWT com os campos atualizados e retorna `{ token }`

### 2. `POST /auth/me/avatar` — upload de avatar

- Usa `@fastify/multipart` para receber o arquivo
- Salva em `services/auth-service/uploads/<playerId>.<ext>`
- Chama `playerRepository.update(playerId, { avatar_url })` onde `avatar_url = /uploads/<filename>`
- Retorna novo JWT com `avatarUrl` no payload + `{ token, avatarUrl }`
- Serve arquivos estáticos via `@fastify/static` no prefixo `/uploads/`

O campo `avatarUrl` é incluído no JWT payload dentro de `player`:
```json
{ "playerId": "...", "playerName": "...", "role": "PLAYER",
  "player": { "id": "...", "name": "...", "class": "...", "race": "...",
              "background": "...", "personality": "...", "interests": "...",
              "avatarUrl": "http://localhost:3002/uploads/xxx.jpg" } }
```

---

## World-service — novas mutations GraphQL

### Schema additions

```graphql
type Mutation {
  updateAffinity(playerName: String!, npcName: String!, score: Float!): AffinityEntry!
  setAffinity(playerName: String!, npcName: String!, level: String!): AffinityEntry!
}

type PlayerProfile {
  id: ID!
  name: String!
  class: String!
  race: String!
  background: String!
  personality: String!
  interests: String!
  avatarUrl: String
  createdAt: String!
}
```

### `setAffinity` resolver

Mapeamento level → score:
- `none` → 0
- `cordial` → 13
- `loyal` → 50
- `intimate` → 88

```typescript
setAffinity: async (_, { playerName, npcName, level }) => {
  const player = await playerRepo.findByName(playerName)
  if (!player) throw new NotFoundError(...)
  const scoreMap = { none: 0, cordial: 13, loyal: 50, intimate: 88 }
  const score = scoreMap[level] ?? 0
  return affinityRepo.upsert({
    playerId: player.id, npcName, level,
    score, interactionCount: 0,
    lastInteraction: new Date().toISOString(),
  })
}
```

Não requer autenticação especial — o player só edita sua própria afinidade (validado pelo nome vindo do JWT no frontend).

### `UpdateAffinityUseCase` / `SetAffinityUseCase`

Criar `services/world-service/src/application/use-cases/SetAffinityUseCase.ts` seguindo o padrão dos outros use-cases.

---

## Domain & Database — ajustes mínimos

### `Player` entity

```typescript
export interface Player {
  id: string
  name: string
  class: string
  race: string
  background: string
  personality: string
  interests: string
  avatarUrl?: string   // novo campo
  createdAt: string
  updatedAt: string
}
```

### `PgPlayerRepository.toPlayer`

Mapear `row.avatar_url` → `avatarUrl`.

---

## Frontend — estrutura de arquivos

```
apps/web/src/
├── components/
│   └── profile/
│       ├── CharacterSheet.tsx         (substituído — agora é modo edição/visualização)
│       ├── CharacterHeader.tsx        (extendido — avatar com upload)
│       ├── CharacterEditForm.tsx      (novo — campos narrativos editáveis)
│       ├── AffinityEditTable.tsx      (novo — tabela de NPCs com dropdown de nível)
│       └── AvatarUpload.tsx           (novo — input de imagem com preview)
└── lib/
    └── graphql/
        └── queries/
            └── profile.ts             (extendido — mutation setAffinity)
```

---

## Frontend — comportamento detalhado

### `CharacterSheet.tsx` (reestruturado)

Estado local:
```typescript
const [editMode, setEditMode] = useState(false)
```

Layout:
```
[Avatar + Nome/Classe/Raça]         [Botão "Editar" / "Salvar"]

-- Modo visualização --
[Antecedente]  [Personalidade]
[Interesses]

-- Modo edição --
[Textarea Antecedente]  [Textarea Personalidade]
[Textarea Interesses]

[Divisor "Relações"]
[AffinityEditTable]   ← sempre visível, editável independentemente
```

### `CharacterHeader.tsx` — avatar

- Exibe `player.avatarUrl` como `<img>` (64×64 arredondado)
- Se não há avatar: ícone SVG genérico (silhueta)
- Botão pequeno "✎" ao hover sobre o avatar abre `<AvatarUpload>`

### `AvatarUpload.tsx`

- `<input type="file" accept="image/*">` oculto, ativado por botão
- Preview local via `FileReader` antes do upload
- `POST /auth/me/avatar` via `FormData`
- Ao sucesso: `login(newToken)` para atualizar o AuthContext

### `CharacterEditForm.tsx`

- Três `<textarea>` para background, personality, interests
- Botão "Salvar" chama `PATCH /auth/me`
- Ao sucesso: `login(newToken)` para atualizar o AuthContext
- Loading state durante o fetch

### `AffinityEditTable.tsx`

- Carrega todos os NPCs via `LIST_NPCS`
- Carrega afinidades do player via `GET_MY_AFFINITIES`
- Para cada NPC: exibe nome, local, nível atual com `<AffinityMeter>`, e um `<select>` com as 4 opções
- Ao mudar o select: chama mutation `SET_AFFINITY` imediatamente (sem botão salvar)
- Loading indicator por linha durante a mutation

```typescript
const LEVELS = [
  { value: 'none',     label: 'Neutro' },
  { value: 'cordial',  label: 'Cordial' },
  { value: 'loyal',    label: 'Leal' },
  { value: 'intimate', label: 'Íntimo' },
]
```

### GraphQL mutations no `profile.ts`

```typescript
export const SET_AFFINITY = gql`
  mutation SetAffinity($playerName: String!, $npcName: String!, $level: String!) {
    setAffinity(playerName: $playerName, npcName: $npcName, level: $level) {
      npcName
      level
      score
      interactionCount
    }
  }
`
```

---

## AuthContext — campos adicionados

```typescript
interface Player {
  id: string
  name: string
  class: string
  race: string
  background?: string
  personality?: string
  interests?: string
  avatarUrl?: string   // novo
}
```

---

## Acceptance checklist

- [ ] Migration 008 aplicada sem erros
- [ ] `PATCH /auth/me` retorna novo JWT com campos atualizados
- [ ] `POST /auth/me/avatar` salva arquivo, serve via `/uploads/`, retorna JWT
- [ ] Mutation `setAffinity` atualiza nível e score no banco
- [ ] Página `/profile` exibe avatar (ou placeholder)
- [ ] Clicar em "Editar" transforma blocos em textareas
- [ ] Salvar campos narrativos atualiza o token e os campos voltam para visualização
- [ ] Upload de avatar mostra preview antes de enviar
- [ ] Tabela de afinidades lista todos os NPCs
- [ ] Mudar o select de um NPC persiste no banco imediatamente
- [ ] `AffinityMeter` atualiza visualmente após change no select
