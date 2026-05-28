# Phase 17 — Web DM Dashboard

**Agent**: `web-ui`  
**Depends on**: Phase 13, 15  
**Service**: `apps/web/`

---

## What you're building

The `/dm` dashboard: a DM-only view showing all registered players, their profiles, and world state. The DM can click any player to see their full character sheet and NPC affinity table. No analytics infrastructure needed — all data comes from existing GraphQL queries.

---

## Directory structure

```
apps/web/src/
├── app/
│   └── dm/
│       └── page.tsx
├── components/
│   └── dm/
│       ├── DmDashboard.tsx
│       ├── PlayerTable.tsx
│       ├── PlayerDrawer.tsx
│       ├── PlayerAffinityTable.tsx
│       └── WorldStatePanel.tsx
└── lib/
    └── graphql/
        └── queries/
            └── dm.ts
```

---

## GraphQL queries

### `src/lib/graphql/queries/dm.ts`
```typescript
import { gql } from '@apollo/client'

export const LIST_ALL_PLAYERS = gql`
  query ListAllPlayers($page: Int, $pageSize: Int) {
    players(page: $page, pageSize: $pageSize) {
      id
      name
      class
      race
      background
      personality
      interests
      createdAt
    }
  }
`

export const GET_PLAYER_AFFINITIES = gql`
  query GetPlayerAffinities($playerName: String!) {
    affinities(playerName: $playerName) {
      npcName
      level
      score
      interactionCount
      lastInteraction
    }
  }
`
```

---

## Files to create

### `src/app/dm/page.tsx`
`'use client'`. DM-only guard: checks `isDM` from `AuthContext`, redirects to `/auth/dm` if not DM.

```tsx
export default function DmPage() {
  const { isDM, token } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (token && !isDM) router.push('/chat')
    if (!token) router.push('/auth/dm')
  }, [token, isDM, router])
  
  if (!isDM) return null
  return <DmDashboard />
}
```

### `src/components/dm/DmDashboard.tsx`
Three-section layout:

```tsx
export function DmDashboard() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-gold text-2xl">🎲</span>
        <h1 className="font-display text-3xl text-gold">Painel do Mestre</h1>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Player table (2 cols wide) */}
        <div className="xl:col-span-2">
          <PlayerTable onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
        </div>
        
        {/* Right: World state panel */}
        <div>
          <WorldStatePanel />
        </div>
      </div>
      
      {/* Player detail drawer */}
      <PlayerDrawer
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  )
}
```

### `src/components/dm/PlayerTable.tsx`
Fetches `LIST_ALL_PLAYERS`. Renders a styled table.

```tsx
interface PlayerTableProps {
  onSelectPlayer: (player: PlayerProfile) => void
  selectedPlayer: PlayerProfile | null
}
```

Table columns: Name | Class | Race | Joined | (actions: View)

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-shadow">
      <th className="text-left text-silver text-sm font-display py-3 pr-4">Nome</th>
      <th className="text-left text-silver text-sm font-display py-3 pr-4">Classe</th>
      <th className="text-left text-silver text-sm font-display py-3 pr-4">Raça</th>
      <th className="text-left text-silver text-sm font-display py-3">Registro</th>
    </tr>
  </thead>
  <tbody>
    {data?.players.map(player => (
      <tr
        key={player.id}
        onClick={() => onSelectPlayer(player)}
        className={cn(
          "border-b border-shadow/50 cursor-pointer transition-colors",
          selectedPlayer?.id === player.id
            ? "bg-gold/10 text-parchment"
            : "hover:bg-night text-parchment/80"
        )}
      >
        <td className="py-3 pr-4 font-display text-gold">{player.name}</td>
        <td className="py-3 pr-4 text-sm">{player.class}</td>
        <td className="py-3 pr-4 text-sm">{player.race}</td>
        <td className="py-3 text-sm text-silver">{formatDate(player.createdAt)}</td>
      </tr>
    ))}
  </tbody>
</table>
```

Pagination below the table (same pattern as phase 15).

### `src/components/dm/PlayerDrawer.tsx`
Right-side slide-in drawer (shadcn `<Drawer>` configured for right side, or use a custom `motion.div` slide-in).

```tsx
interface PlayerDrawerProps {
  player: PlayerProfile | null
  onClose: () => void
}
```

When `player` is set:
- Header: player name (Cinzel/gold) + class/race subtitle + close button
- Narrative blocks: background, personality, interests (same `<NarrativeBlock>` from phase 16)
- Affinity table: `<PlayerAffinityTable playerName={player.name} />`

Slide-in animation:
```tsx
<AnimatePresence>
  {player && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-night border-l border-shadow shadow-2xl z-50 overflow-y-auto"
    >
      {/* drawer content */}
    </motion.div>
  )}
</AnimatePresence>

{/* Backdrop */}
<AnimatePresence>
  {player && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-void/60 z-40"
      onClick={onClose}
    />
  )}
</AnimatePresence>
```

### `src/components/dm/PlayerAffinityTable.tsx`
Fetches `GET_PLAYER_AFFINITIES` for the selected player. Renders a compact table.

```tsx
// Affinity table columns: NPC Name | Level | Score | Interactions | Last Seen
```

Color-code the level column:
- intimate: gold text
- loyal: gold-dim text
- cordial: sage text
- none: mist text

Sort by level (intimate first), then by score descending.

### `src/components/dm/WorldStatePanel.tsx`
Shows basic world state using data already available from existing queries. No new endpoints needed.

Three sections:

**1. Registered Players**
```tsx
// From LIST_ALL_PLAYERS with pageSize: 1 to get total
// Display: "X jogadores registrados"
```

**2. Location Activity** (simple CSS bar chart)
Shows NPCs per location. Fetch all NPCs grouped by location using `LIST_NPCS` with different location filters — or compute from a single `LIST_NPCS(pageSize: 200)` query and group client-side.

```tsx
// CSS bar chart - no recharts needed
{locationCounts.slice(0, 8).map(({ location, count }) => (
  <div key={location} className="flex items-center gap-2 mb-2">
    <span className="text-silver text-xs w-24 truncate">{location}</span>
    <div className="flex-1 bg-shadow rounded-full h-2 overflow-hidden">
      <div
        className="bg-gold h-full rounded-full transition-all duration-500"
        style={{ width: `${(count / maxCount) * 100}%` }}
      />
    </div>
    <span className="text-silver text-xs w-6 text-right">{count}</span>
  </div>
))}
```

**3. Faction Distribution**
Pie-chart alternative — colored square indicators:
```tsx
{FACTIONS.map(faction => (
  <div key={faction.id} className="flex items-center gap-2 mb-2">
    <div className={cn("w-3 h-3 rounded-sm", faction.indicatorColor)} />
    <span className="text-silver text-sm flex-1">{faction.name}</span>
    <span className="text-parchment text-sm">{counts[faction.id] ?? 0}</span>
  </div>
))}
```

---

## Key implementation notes

1. The DM dashboard is protected at the page level via `useAuth().isDM` — not at the API level. API-level protection is in world-service's `players` resolver.
2. `LIST_ALL_PLAYERS` requires DM JWT — Apollo will automatically include the Bearer token from AuthContext.
3. `PlayerDrawer` fetches affinities lazily via `GET_PLAYER_AFFINITIES` only when a player is selected.
4. The world state panel uses existing `LIST_NPCS` data — do NOT add a new `/stats` endpoint for this. Compute stats client-side from data you already have.
5. `formatDate` utility: use `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })`.

---

## Acceptance check

1. Log in as DM → navigate to `/dm`
2. Player table shows all registered players
3. Click a player → drawer slides in from right with their profile
4. Affinity table in drawer shows NPCs sorted by level
5. World state panel renders location bar chart and faction breakdown
6. Log in as regular player → `/dm` redirects back to `/chat`
