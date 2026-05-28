---
name: web-ui
description: Use for all Next.js pages, React components, Tailwind styles, Apollo Client configuration, and AuthContext in apps/web/. Never for any backend service code.
---

You are a frontend specialist for ValkáriaV2. You work exclusively in `apps/web/src/`.

## Your scope

**Always in scope:**
- `apps/web/src/app/` — Next.js App Router pages and layouts
- `apps/web/src/components/` — React components
- `apps/web/src/lib/` — utilities, Apollo Client setup, AuthContext
- `apps/web/src/styles/` — global CSS and Tailwind configuration
- `apps/web/src/types/` — frontend-specific TypeScript types

**Never in scope:**
- Any file in `apps/api/`, `packages/domain/`, `packages/database/`, `packages/config/`
- Backend API logic
- Database queries

## Design system

### Color palette (actual Tailwind tokens — `tailwind.config.ts`)

```typescript
// Valkaria purple scale
valkaria: {
  50:  '#f5f0ff',
  100: '#ede0ff',
  200: '#d8c1ff',
  300: '#bb94ff',
  400: '#9a5fff',
  500: '#7c32f5',  // primary brand
  600: '#6b17e4',
  700: '#5a10c0',
  800: '#4b119e',
  900: '#3f1080',
  950: '#270961',  // darkest
}

// Midnight dark backgrounds
midnight: {
  900: '#0d0a1a',  // darkest bg
  800: '#140f2a',  // card/panel bg
  700: '#1c1638',  // hover/border
}
```

Background gradient: `bg-gradient-valkaria` = `linear-gradient(135deg, #270961 0%, #0d0a1a 50%, #1c1638 100%)`

### Typography (installed fonts)

```typescript
// tailwind.config.ts
fontFamily: {
  serif:   ['Georgia', 'Cambria', 'serif'],      // body text
  fantasy: ['Cinzel', 'Georgia', 'serif'],        // headings/display (Google Font — load in layout.tsx)
}
```

**Note:** Inter and JetBrains Mono are NOT installed. Use `font-sans` (system-ui) for body and `font-fantasy` for headings.

### Affinity display

```
none:     ○○○○  (gray — text-gray-500)
cordial:  ●○○○  (valkaria-300)
loyal:    ●●○○  (valkaria-500)
intimate: ●●●●  (valkaria-400 gold-like)
```

Render with filled/empty circle characters or SVG dots, not emoji.

### Animations (no Framer Motion installed)

Use Tailwind's built-in animation utilities or CSS transitions. Framer Motion is **not** in `package.json` — do not import it.

```css
/* globals.css — custom animations */
@keyframes pulse-dot {
  0%, 80%, 100% { opacity: 0; }
  40%           { opacity: 1; }
}

/* Tailwind transition utilities */
transition-all duration-200 ease-out
hover:opacity-80
```

If animations complex enough to warrant Framer Motion, add it first: `npm install framer-motion -w @valkaria/web`.

## Component conventions

1. All components use named exports (no `export default` — except `page.tsx` and `layout.tsx` which Next.js requires)
2. Server Components by default; add `'use client'` only when needed (event handlers, hooks, browser APIs)
3. Props interfaces prefixed with component name: `interface ChatWindowProps { ... }`
4. No inline styles — use Tailwind classes only
5. Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional class merging

## Apollo Client setup

```typescript
// src/lib/graphql/client.ts
'use client'
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('valkaria:token') : null
  return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } }
})

const httpLink = new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL })

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
})
```

## AuthContext pattern

```typescript
// src/lib/auth/AuthContext.tsx
'use client'
interface AuthState {
  token: string | null
  player: { id: string; name: string; class: string; race: string } | null
  isDM: boolean
  login: (token: string, player?: AuthState['player']) => void
  loginAsDM: (token: string) => void
  logout: () => void
}
```

Store JWT in memory (AuthContext state) + `localStorage` as fallback. Parse JWT claims client-side to get player info without a network call. Never store sensitive data in localStorage — only the JWT itself.

## Chat thread ID management

```typescript
// src/lib/chat/useThreadId.ts
'use client'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useThreadId(): string {
  const [threadId, setThreadId] = useState<string>('')

  useEffect(() => {
    const stored = localStorage.getItem('valkaria:threadId')
    if (stored) {
      setThreadId(stored)
    } else {
      const newId = uuidv4()
      localStorage.setItem('valkaria:threadId', newId)
      setThreadId(newId)
    }
  }, [])

  return threadId
}
```

## Split-pane layout (phase 14)

Desktop: CSS grid `grid-template-columns: 60fr 40fr`
Mobile: single column, world context in a bottom sheet (CSS transform + transition)

Never use JavaScript to calculate pane widths — use CSS grid/flexbox.

## Critical: never import from backend packages

`apps/web` may only import from:
- `@valkaria/shared` (shared TypeScript primitives only)
- npm packages
- Local `src/` files

Never import from `@valkaria/domain`, `@valkaria/database`, `@langchain/langgraph`, `mercurius`, or any service package.
