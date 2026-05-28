# Phase 14 — Web Chat Interface

**Agent**: `web-ui`  
**Depends on**: Phase 13  
**Service**: `apps/web/`

---

## What you're building

The main chat experience: the split-pane layout with an immersive chat on the left and a live world context panel on the right. This is the flagship screen — every interaction with NPCs happens here.

---

## Directory structure

```
apps/web/src/
├── app/
│   └── chat/
│       └── page.tsx
├── components/
│   └── chat/
│       ├── ChatLayout.tsx         Split-pane container
│       ├── ChatWindow.tsx         Message history + input
│       ├── ChatInput.tsx          Textarea with send logic
│       ├── MessageBubble.tsx      Single message rendering
│       ├── TypingIndicator.tsx    Animated dots
│       ├── WorldContextPanel.tsx  Right pane with NPC info
│       ├── NpcCard.tsx            NPC info card
│       └── AffinityMeter.tsx      4-dot affinity display
└── lib/
    ├── graphql/
    │   ├── mutations/
    │   │   └── chat.ts
    │   └── queries/
    │       └── npc.ts
    └── chat/
        ├── useThreadId.ts
        └── useNpcExtractor.ts     Extracts NPC names from responses
```

---

## GraphQL definitions

### `src/lib/graphql/mutations/chat.ts`
```typescript
import { gql } from '@apollo/client'

export const SEND_CHAT = gql`
  mutation SendChat($message: String!, $threadId: String!) {
    chat(message: $message, threadId: $threadId) {
      response
    }
  }
`
```

Note: Chat goes to chat-service (`POST /chat` REST) not through GraphQL. Use `fetch` directly:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-thread-id': threadId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ message }),
})
```

### `src/lib/graphql/queries/npc.ts`
```typescript
import { gql } from '@apollo/client'

export const GET_NPC = gql`
  query GetNpc($name: String!) {
    npc(name: $name) {
      name
      faction
      role
      location
      metadata {
        likes
        dislikes
        benefitsCordial
        benefitsLoyal
        benefitsIntimate
      }
    }
  }
`

export const GET_AFFINITY = gql`
  query GetAffinity($playerName: String!, $npcName: String!) {
    affinity(playerName: $playerName, npcName: $npcName) {
      level
      score
    }
  }
`
```

---

## Files to create

### `src/app/chat/page.tsx`
`'use client'`. Uses `useRequireAuth()` to guard the page. Renders `<ChatLayout>`.

### `src/components/chat/ChatLayout.tsx`
```tsx
'use client'
export function ChatLayout() {
  const [worldContextNpc, setWorldContextNpc] = useState<string | null>(null)
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Chat — 60% desktop, full mobile */}
      <div className="flex-1 lg:flex-[6] flex flex-col min-w-0">
        <ChatWindow onNpcMentioned={setWorldContextNpc} />
      </div>
      
      {/* Right: World Context — hidden on mobile (bottom sheet instead) */}
      <div className="hidden lg:flex lg:flex-[4] flex-col border-l border-shadow">
        <WorldContextPanel activeNpc={worldContextNpc} />
      </div>
    </div>
  )
}
```

### `src/components/chat/ChatWindow.tsx`
`'use client'`. Core chat component:

```tsx
interface ChatWindowProps {
  onNpcMentioned: (npcName: string) => void
}
```

- Maintains `messages: Message[]` in state
- `useThreadId()` for thread ID
- `useNpcExtractor()` to detect NPC names in responses
- Auto-scroll to bottom on new messages (`useEffect` with `scrollRef`)
- Shows `<TypingIndicator>` while waiting for response

```typescript
interface Message {
  id: string
  role: 'user' | 'narrator'
  content: string
  timestamp: Date
}
```

### `src/components/chat/MessageBubble.tsx`
Renders one message differently based on role:

**Narrator** (role: 'narrator'):
```tsx
<motion.div
  initial={{ opacity: 0, x: -16 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3 }}
  className="flex gap-3 mb-4"
>
  <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
    <span className="text-gold text-xs">⚔</span>
  </div>
  <div className="flex-1 bg-night rounded-lg p-4 border border-shadow">
    <p className="text-silver text-xs mb-1 font-display">Narrador</p>
    <p className="text-parchment leading-relaxed whitespace-pre-wrap">{content}</p>
  </div>
</motion.div>
```

**Player** (role: 'user'):
```tsx
<motion.div
  initial={{ opacity: 0, x: 16 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.2 }}
  className="flex gap-3 mb-4 justify-end"
>
  <div className="max-w-[80%] bg-shadow/50 rounded-lg p-4 border border-mist/30">
    <p className="text-silver/80 text-sm">{content}</p>
  </div>
</motion.div>
```

### `src/components/chat/TypingIndicator.tsx`
```tsx
export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
        <span className="text-gold text-xs">⚔</span>
      </div>
      <div className="bg-night rounded-lg p-4 border border-shadow">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gold/60"
              style={{
                animation: 'pulse-dot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### `src/components/chat/ChatInput.tsx`
```tsx
interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}
```

- Auto-expanding `<textarea>` (CSS `resize: none`, `overflow-y: auto`, max-height ~120px)
- Enter = send, Shift+Enter = newline
- Send button (disabled when loading or empty)
- Shows character count when approaching 500 chars

### `src/components/chat/WorldContextPanel.tsx`
Right pane. Shows information about the most recently mentioned NPC.

```tsx
interface WorldContextPanelProps {
  activeNpc: string | null
}
```

- If `activeNpc` is null: show "O mundo de Candessah" placeholder with a brief atmospheric description
- If `activeNpc` is set: fetch NPC data via `GET_NPC` query and render `<NpcCard>`
- Also fetch affinity if player is authenticated: `GET_AFFINITY`
- Header: "Contexto do Mundo" in Cinzel font, gold border-bottom

### `src/components/chat/NpcCard.tsx`
```tsx
interface NpcCardProps {
  npc: { name: string; faction: string; role: string; location?: string; metadata?: NpcMetadata }
  affinity?: { level: string; score: number }
}
```

Layout:
- Top: NPC name in Cinzel/gold + faction badge chip (colored by faction)
- Location chip below name
- `<AffinityMeter>` if affinity data available
- Description or likes/dislikes (collapsed by default, expand on click)
- Hover: show benefits for current affinity level

### `src/components/chat/AffinityMeter.tsx`
```tsx
export function AffinityMeter({ level }: { level: string }) {
  const levels = ['none', 'cordial', 'loyal', 'intimate']
  const filled = levels.indexOf(level)
  
  const colors = {
    none: 'bg-mist',
    cordial: 'bg-sage',
    loyal: 'bg-gold-dim',
    intimate: 'bg-gold',
  }
  const color = colors[level as keyof typeof colors] ?? 'bg-mist'
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {levels.map((_, i) => (
          <div
            key={i}
            className={cn('w-2 h-2 rounded-full transition-all', i <= filled ? color : 'bg-mist/30')}
          />
        ))}
      </div>
      <span className="text-xs text-silver capitalize">{level}</span>
    </div>
  )
}
```

### `src/lib/chat/useNpcExtractor.ts`
Extracts NPC names from the narrator response using the asterisk pattern (`**NpcName**`) and a list of known NPC names from the world. Returns the first mentioned NPC name.

```typescript
export function useNpcExtractor() {
  const extractNpcName = (text: string): string | null => {
    const boldMatch = text.match(/\*\*([^*]+)\*\*/)
    if (boldMatch) return boldMatch[1]
    return null
  }
  return { extractNpcName }
}
```

---

## Mobile: Bottom Sheet for World Context

On mobile, the `WorldContextPanel` is hidden and triggered via a floating button:
```tsx
{/* Mobile: floating "World" button */}
<button
  className="lg:hidden fixed bottom-24 right-4 z-50 bg-night border border-gold/40 rounded-full w-12 h-12 flex items-center justify-center"
  onClick={() => setWorldDrawerOpen(true)}
>
  <span className="text-gold">🌍</span>
</button>

{/* Mobile: Bottom drawer */}
<Drawer open={worldDrawerOpen} onOpenChange={setWorldDrawerOpen}>
  <DrawerContent className="bg-void border-t border-shadow">
    <WorldContextPanel activeNpc={worldContextNpc} />
  </DrawerContent>
</Drawer>
```

---

## Key implementation notes

1. Chat requests go to `NEXT_PUBLIC_API_URL/chat` (REST, not GraphQL) to use `x-thread-id` header.
2. NPC queries go through `NEXT_PUBLIC_GRAPHQL_URL` (Apollo GraphQL).
3. The world context panel updates on every new narrator response — extract NPC name from the response and trigger a refetch.
4. `useThreadId` (from phase 12 spec) generates and persists the thread ID in localStorage.
5. Do not show the `WorldContextPanel` if the NPC query returns null — show the placeholder instead.

---

## Acceptance check

Manual browser test (ensure chat-service and world-service are running):
1. Log in as player → redirected to `/chat`
2. Send "Me fale sobre Aaliyah" → narrator responds about Aaliyah
3. Aaliyah's NpcCard appears in the right panel with faction badge
4. `AffinityMeter` shows correct level (or `none` if first interaction)
5. On mobile viewport: world context hidden, floating button visible, drawer opens on click
6. Send another message while one is pending → input disabled, typing indicator visible
