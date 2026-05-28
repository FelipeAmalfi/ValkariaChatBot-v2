# Phase 16 — Web Character Profile

**Agent**: `web-ui`  
**Depends on**: Phase 13, 14  
**Service**: `apps/web/`

---

## What you're building

The `/profile` page: a character sheet showing the player's identity, narrative background, and all their NPC relationships sorted by affinity. The aesthetic mimics a physical RPG character sheet — parchment borders, decorative separators, and visual affinity meters.

---

## Directory structure

```
apps/web/src/
├── app/
│   └── profile/
│       └── page.tsx
├── components/
│   └── profile/
│       ├── CharacterSheet.tsx
│       ├── CharacterHeader.tsx
│       ├── NarrativeBlock.tsx
│       ├── AffinityGrid.tsx
│       └── AffinityNpcCard.tsx
└── lib/
    └── graphql/
        └── queries/
            └── profile.ts
```

---

## GraphQL queries

### `src/lib/graphql/queries/profile.ts`
```typescript
import { gql } from '@apollo/client'

export const GET_MY_PROFILE = gql`
  query GetMyProfile($playerName: String!) {
    player: npc(name: $playerName) {
      name
    }
  }
`

export const GET_MY_AFFINITIES = gql`
  query GetMyAffinities($playerName: String!) {
    affinities(playerName: $playerName) {
      npcName
      level
      score
      interactionCount
    }
  }
`

export const GET_NPC_DETAILS = gql`
  query GetNpcDetails($name: String!) {
    npc(name: $name) {
      name
      faction
      role
      location
      metadata {
        benefitsCordial
        benefitsLoyal
        benefitsIntimate
      }
    }
  }
`
```

Note: player data (name, class, race, background, etc.) comes from `AuthContext` (decoded from JWT). No extra query needed for the player's own profile fields — they're stored in the token.

---

## Files to create

### `src/app/profile/page.tsx`
`'use client'`. Uses `useRequireAuth()`. Renders `<CharacterSheet>`.

### `src/components/profile/CharacterSheet.tsx`
Main container. Reads player data from `AuthContext`. Fetches affinities.

```tsx
export function CharacterSheet() {
  const { player } = useAuth()
  const { data } = useQuery(GET_MY_AFFINITIES, {
    variables: { playerName: player?.name },
    skip: !player,
  })
  
  const sortedAffinities = useMemo(() => {
    const order = { intimate: 0, loyal: 1, cordial: 2, none: 3 }
    return [...(data?.affinities ?? [])].sort(
      (a, b) => order[a.level as keyof typeof order] - order[b.level as keyof typeof order]
    )
  }, [data])
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <CharacterHeader player={player} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <NarrativeBlock title="Antecedente" content={player?.background} />
        <NarrativeBlock title="Personalidade" content={player?.personality} />
        <NarrativeBlock title="Interesses" content={player?.interests} className="md:col-span-2" />
      </div>
      <AffinityGrid affinities={sortedAffinities} />
    </div>
  )
}
```

### `src/components/profile/CharacterHeader.tsx`
Top section of the character sheet:

```tsx
interface CharacterHeaderProps {
  player: { name: string; class: string; race: string } | null
}
```

Layout:
- Large name in Cinzel font, gold color
- Class + Race as subtitle (`"Guerreiro Humano"`)
- Class/race badge chips
- Decorative horizontal rule with a sword icon (`⚔`)

```tsx
<div className="text-center border-b border-gold/30 pb-6">
  <h1 className="font-display text-4xl text-gold mb-2">{player?.name}</h1>
  <p className="text-silver text-lg">{player?.class} • {player?.race}</p>
  <div className="flex justify-center gap-2 mt-3">
    <Badge className="bg-shadow text-parchment border-shadow">{player?.class}</Badge>
    <Badge className="bg-shadow text-parchment border-shadow">{player?.race}</Badge>
  </div>
  <div className="flex items-center gap-4 mt-6 text-gold/40">
    <div className="flex-1 h-px bg-gold/20" />
    <span className="text-gold">⚔</span>
    <div className="flex-1 h-px bg-gold/20" />
  </div>
</div>
```

### `src/components/profile/NarrativeBlock.tsx`
```tsx
interface NarrativeBlockProps {
  title: string
  content?: string
  className?: string
}
```

Styled block mimicking a parchment section:
```tsx
<div className={cn("bg-night/60 rounded-lg border border-shadow p-5", className)}>
  <h3 className="font-display text-gold text-sm uppercase tracking-widest mb-3">{title}</h3>
  <div className="w-8 h-px bg-gold/30 mb-4" />
  <p className="text-parchment/90 leading-relaxed text-sm">{content ?? '—'}</p>
</div>
```

### `src/components/profile/AffinityGrid.tsx`
Section below the narrative blocks. Shows all NPC relationships.

```tsx
interface AffinityGridProps {
  affinities: Array<{ npcName: string; level: string; score: number; interactionCount: number }>
}
```

Layout:
- Section title: "Relações" with a `⚔` separator
- If empty: atmospheric empty state ("Ainda não cultivou relações em Candessah.")
- Grid of `<AffinityNpcCard>` sorted by level (intimate first)

Group by level with sub-headers if > 5 total affinities:
- `● Íntimo` (gold)
- `◕ Leal` (gold-dim)
- `◑ Cordial` (sage)
- `○ Sem afinidade` (mist)

### `src/components/profile/AffinityNpcCard.tsx`
More detailed than the gallery card — shows interaction count and expandable benefits.

```tsx
interface AffinityNpcCardProps {
  npcName: string
  level: string
  score: number
  interactionCount: number
}
```

State: `isExpanded: boolean`

**Collapsed** (default):
- NPC name (Cinzel, parchment)
- `<AffinityMeter level={level}>` from phase 14
- Interaction count: `"12 interações"`

**Expanded** (click to toggle, animated with Framer Motion):
- All of the above, plus:
- Fetches `GET_NPC_DETAILS` lazily (only on first expand)
- Shows benefits for current level and locked benefits for higher levels (with lock icon)

```tsx
// Benefits display
const benefits = {
  cordial: npc?.metadata?.benefitsCordial,
  loyal: npc?.metadata?.benefitsLoyal,
  intimate: npc?.metadata?.benefitsIntimate,
}

const levelOrder = ['cordial', 'loyal', 'intimate']
const currentIdx = levelOrder.indexOf(level)

{levelOrder.map((tier, idx) => (
  <div key={tier} className={cn(
    "flex items-start gap-2 text-sm py-1",
    idx <= currentIdx ? "text-parchment" : "text-mist"
  )}>
    <span>{idx <= currentIdx ? '✓' : '🔒'}</span>
    <span className="capitalize font-display text-xs text-gold/60">{tier}:</span>
    <span>{benefits[tier as keyof typeof benefits] ?? '—'}</span>
  </div>
))}
```

Expansion animation:
```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.25 }}
  className="overflow-hidden"
>
  {/* expanded content */}
</motion.div>
```

---

## Key implementation notes

1. Player profile data (name, class, race, background, personality, interests) is stored in `AuthContext` — decode from JWT on login or store explicitly in context.
2. Update `AuthContext` and the `VERIFY_AUTH` mutation to return `{ id, name, class, race, background, personality, interests }` so all profile fields are available client-side.
3. `GET_NPC_DETAILS` in `AffinityNpcCard` is lazy — only fire it when the card is first expanded. Use Apollo's `useLazyQuery`.
4. Sort affinities: `intimate → loyal → cordial → none`. Within each group, sort by `score` descending.
5. Empty state should still look atmospheric — use italic text and a subtle border, not a generic "No data" message.

---

## Acceptance check

1. Log in as player → navigate to `/profile`
2. Character header shows name, class, race in Cinzel/gold
3. Narrative blocks show background, personality, interests
4. Affinity grid shows all NPC relationships sorted by level
5. Click an `AffinityNpcCard` → expands with benefits (fetches NPC data on first expand)
6. Benefits for locked levels show lock icon
7. Empty affinity state renders with atmospheric message (if no interactions yet)
