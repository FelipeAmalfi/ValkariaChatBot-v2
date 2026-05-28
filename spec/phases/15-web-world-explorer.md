# Phase 15 — Web World Explorer

**Agent**: `web-ui`  
**Depends on**: Phase 12, 05, 06  
**Service**: `apps/web/`

---

## What you're building

The `/world` page: a tabbed explorer for NPCs, locations, and factions. Players browse the world of Candessah, discover NPCs, and see their affinity relationships visualized. This is the world-building companion to the chat interface.

---

## Directory structure

```
apps/web/src/
├── app/
│   └── world/
│       └── page.tsx
├── components/
│   └── world/
│       ├── WorldExplorer.tsx       Tabbed container
│       ├── NpcGallery.tsx          NPC card grid
│       ├── NpcGalleryCard.tsx      Individual NPC card in gallery
│       ├── NpcFilter.tsx           Location + faction filter sidebar
│       ├── LocationBrowser.tsx     Location list + expansion
│       ├── LocationCard.tsx        Single location with NPCs
│       └── FactionOverview.tsx     4 faction cards
└── lib/
    └── graphql/
        └── queries/
            └── world.ts
```

---

## GraphQL queries

### `src/lib/graphql/queries/world.ts`
```typescript
import { gql } from '@apollo/client'

export const LIST_NPCS = gql`
  query ListNpcs($location: String, $faction: String, $page: Int, $pageSize: Int) {
    npcs(location: $location, faction: $faction, page: $page, pageSize: $pageSize) {
      name
      faction
      role
      location
    }
  }
`

export const LIST_LOCATIONS = gql`
  query ListLocations($page: Int, $pageSize: Int) {
    locations(page: $page, pageSize: $pageSize) {
      id
      name
      description
      services
    }
  }
`

export const GET_AFFINITIES = gql`
  query GetAffinities($playerName: String!) {
    affinities(playerName: $playerName) {
      npcName
      level
      score
    }
  }
`
```

---

## Files to create

### `src/app/world/page.tsx`
`'use client'`. Renders `<WorldExplorer>` inside `<PageTransition>`. Does NOT require auth (world is viewable by guests — affinity data just won't show).

### `src/components/world/WorldExplorer.tsx`
Tabs container using shadcn `<Tabs>`:

```tsx
export function WorldExplorer() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl text-gold mb-2">O Mundo de Valkária</h1>
      <p className="text-silver mb-8">Explore Candessah e seus habitantes</p>
      
      <Tabs defaultValue="npcs">
        <TabsList className="bg-night border border-shadow mb-6">
          <TabsTrigger value="npcs">Personagens</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="factions">Facções</TabsTrigger>
        </TabsList>
        
        <TabsContent value="npcs">
          <NpcGallery />
        </TabsContent>
        <TabsContent value="locations">
          <LocationBrowser />
        </TabsContent>
        <TabsContent value="factions">
          <FactionOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### `src/components/world/NpcGallery.tsx`
Manages pagination and filtering state. Fetches NPCs via `LIST_NPCS`. Fetches player affinities via `GET_AFFINITIES` (only if authenticated).

Layout: filter sidebar on left + card grid on right.

```tsx
export function NpcGallery() {
  const [filters, setFilters] = useState({ location: '', faction: '', page: 1 })
  const { token, player } = useAuth()
  
  const { data: npcsData, loading } = useQuery(LIST_NPCS, {
    variables: { ...filters, pageSize: 20 }
  })
  
  const { data: affinityData } = useQuery(GET_AFFINITIES, {
    variables: { playerName: player?.name },
    skip: !player,
  })
  
  const affinityMap = useMemo(() => {
    return Object.fromEntries(
      (affinityData?.affinities ?? []).map(a => [a.npcName, a])
    )
  }, [affinityData])
  
  return (
    <div className="flex gap-6">
      <NpcFilter value={filters} onChange={setFilters} />
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {npcsData?.npcs.map(npc => (
            <NpcGalleryCard
              key={npc.name}
              npc={npc}
              affinity={affinityMap[npc.name]}
            />
          ))}
        </div>
        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page === 1}
            className="px-4 py-2 bg-night border border-shadow rounded disabled:opacity-30"
          >
            ←
          </button>
          <span className="px-4 py-2 text-silver">Página {filters.page}</span>
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            disabled={(npcsData?.npcs.length ?? 0) < 20}
            className="px-4 py-2 bg-night border border-shadow rounded disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
```

### `src/components/world/NpcGalleryCard.tsx`
```tsx
interface NpcGalleryCardProps {
  npc: { name: string; faction: string; role: string; location?: string }
  affinity?: { level: string; score: number }
}
```

Card layout:
- **Top**: faction-colored left border stripe (2px)
- **Portrait**: SVG placeholder (faction-colored icon, 64×64px)
- **Name**: Cinzel font, parchment color
- **Faction chip**: small badge with faction color
- **Location**: small text with 📍 icon
- **Affinity meter**: `<AffinityMeter>` from phase 14 (if affinity data present)
- **Hover**: card elevates, border brightens

Faction colors for border:
```typescript
const factionColors = {
  'valkaria_order':    'border-l-blue-500',
  'shadow_guild':      'border-l-purple-700',
  'merchant_league':   'border-l-yellow-600',
  'free_cities':       'border-l-green-700',
  'neutral':           'border-l-gray-600',
}
```

### `src/components/world/NpcFilter.tsx`
Sidebar with two selects: location filter and faction filter. All options pulled from a static list (locations and factions are finite).

```tsx
const FACTIONS = ['Todas', 'Ordem de Valkária', 'Guilda das Sombras', 'Liga Mercante', 'Cidades Livres', 'Neutro']
```

For locations: use `LIST_LOCATIONS` query to populate the dropdown dynamically.

### `src/components/world/LocationBrowser.tsx`
Lists locations with a click-to-expand pattern. Fetches `LIST_LOCATIONS`.

```tsx
function LocationBrowser() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data } = useQuery(LIST_LOCATIONS, { variables: { pageSize: 50 } })
  
  return (
    <div className="space-y-2">
      {data?.locations.map(location => (
        <LocationCard
          key={location.id}
          location={location}
          isExpanded={expanded === location.name}
          onToggle={() => setExpanded(expanded === location.name ? null : location.name)}
        />
      ))}
    </div>
  )
}
```

### `src/components/world/LocationCard.tsx`
```tsx
// Collapsed: name + services chips
// Expanded (AnimatePresence): + description + NPC list for this location
```

When expanded, show a sub-query for `npcs(location: location.name, pageSize: 10)`.

Services as small chips: `<span className="px-2 py-0.5 bg-shadow text-silver text-xs rounded-full">{service}</span>`

### `src/components/world/FactionOverview.tsx`
4 hardcoded faction cards (factions don't change — no query needed):

```typescript
const FACTIONS = [
  {
    id: 'valkaria_order',
    name: 'Ordem de Valkária',
    motto: '"Honra e proteção acima de tudo."',
    description: 'Cavaleiros e guardiões da lei em Candessah. Protegem os inocentes e mantêm a ordem.',
    color: 'border-blue-500/50',
    headerColor: 'text-blue-400',
    icon: '⚔',
  },
  {
    id: 'shadow_guild',
    name: 'Guilda das Sombras',
    motto: '"Informação é poder. Poder é sobrevivência."',
    description: 'Rede de espiões, ladrões e negociadores de segredos. Operam nas sombras de Candessah.',
    color: 'border-purple-700/50',
    headerColor: 'text-purple-400',
    icon: '🗡',
  },
  {
    id: 'merchant_league',
    name: 'Liga Mercante',
    motto: '"Todo acordo tem um preço justo."',
    description: 'Comerciantes e banqueiros que controlam o fluxo de riqueza pela cidade.',
    color: 'border-yellow-600/50',
    headerColor: 'text-yellow-400',
    icon: '⚖',
  },
  {
    id: 'free_cities',
    name: 'Cidades Livres',
    motto: '"Nenhuma corrente nos prende."',
    description: 'Aventureiros e independentes que não devem lealdade a nenhuma facção.',
    color: 'border-green-700/50',
    headerColor: 'text-green-400',
    icon: '🗺',
  },
]
```

Each card: colored border, faction icon, name (Cinzel), motto (italic), description, member count (from a `npcs(faction:...)` query or hardcoded approximate).

---

## Key implementation notes

1. World page is accessible to guests — don't redirect unauthenticated users.
2. Affinity data is fetched optionally — skip the query if no player is logged in.
3. Pagination check: if `npcs.length < 20`, disable the "next" button (last page).
4. Location NPCs in `LocationCard` use a lazy query (only fires when expanded).
5. `affinityMap` memoization prevents re-building the lookup object on every render.

---

## Acceptance check

1. Navigate to `/world` (works without login)
2. "Personagens" tab: NPC grid loads with faction-colored borders
3. Filter by faction → grid updates
4. Next/prev pagination → different NPCs shown
5. "Locais" tab: location list; click to expand → shows description + NPC count
6. "Facções" tab: 4 faction cards render with correct colors
7. Log in as player → affinity meters appear on NPC cards where affinity exists
