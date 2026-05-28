# Phase 12 — Web Foundation

**Agent**: `web-ui`  
**Depends on**: Phase 01, 11  
**Service**: `apps/web/`

---

## What you're building

The Next.js 15 web app foundation: App Router setup, dark fantasy design system, base UI components, navigation, and animation wrappers. No feature pages yet — just the shell that all later phases build inside.

---

## Directory structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          Root layout with Providers
│   │   ├── page.tsx            HomePage (landing)
│   │   ├── globals.css         Design tokens + base styles
│   │   └── loading.tsx         Global loading UI
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── PageTransition.tsx
│   │   ├── ui/                 shadcn/ui components (dark themed)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── drawer.tsx
│   │   │   └── tabs.tsx
│   │   └── background/
│   │       └── ParticleCanvas.tsx
│   └── lib/
│       ├── graphql/
│       │   └── client.ts
│       ├── auth/
│       │   └── AuthContext.tsx
│       └── utils.ts
├── public/
│   └── favicon.ico
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Packages to install

```bash
# Initialize Next.js (if starting fresh — use this exact command)
npx create-next-app@latest apps/web --typescript --tailwind --app --no-src-dir
# Then move src/ structure in manually

# Or install into existing workspace:
npm install next@^15.1.0 react@^19.0.0 react-dom@^19.0.0 \
  @apollo/client graphql \
  framer-motion \
  class-variance-authority clsx tailwind-merge \
  lucide-react \
  uuid \
  -w @valkaria/web

npm install -D @types/react@^19.0.0 @types/react-dom@^19.0.0 \
  @types/uuid \
  @playwright/test \
  -w @valkaria/web

# Initialize shadcn/ui (run inside apps/web/)
cd apps/web && npx shadcn@latest init
# Choose: Dark theme, CSS variables, default style
```

Add these shadcn components one at a time:
```bash
cd apps/web
npx shadcn@latest add button card badge input drawer tabs tooltip
```

---

## Files to create

### `apps/web/tailwind.config.ts`
See `spec/agents/web-ui.md` for the complete config with dark fantasy color tokens and custom font families.

### `src/app/globals.css`
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 260 40% 6%;        /* void */
    --foreground: 40 50% 90%;        /* parchment */
    --card: 270 45% 12%;             /* night */
    --card-foreground: 40 50% 90%;
    --border: 270 35% 22%;           /* shadow */
    --input: 270 35% 22%;
    --ring: 43 60% 55%;              /* gold */
    --primary: 43 60% 55%;
    --primary-foreground: 260 40% 6%;
    --muted: 270 25% 30%;
    --muted-foreground: 260 20% 65%;
    --accent: 43 60% 55%;
    --accent-foreground: 260 40% 6%;
    --destructive: 0 70% 32%;        /* ember */
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-void text-parchment font-body;
    background-image: radial-gradient(ellipse at top, #2d1b4e 0%, #0d0717 70%);
    min-height: 100vh;
  }
  
  h1, h2, h3 { @apply font-display; }
  
  /* Atmospheric scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { @apply bg-void; }
  ::-webkit-scrollbar-thumb { @apply bg-shadow rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-mist; }
  
  /* Selection color */
  ::selection { @apply bg-gold/30 text-parchment; }
}

@layer utilities {
  .text-gold { color: #c9a84c; }
  .bg-night { background-color: #1a0d2e; }
  .bg-void { background-color: #0d0717; }
  .border-shadow { border-color: #2d1b4e; }
}

/* Typing indicator animation */
@keyframes pulse-dot {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* Particle float */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
```

### `src/app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import { ApolloProvider } from '@/lib/graphql/ApolloProvider'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import './globals.css'

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '600', '700'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Valkária — Candessah',
  description: 'RPG interativo com NPCs inteligentes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable}`}>
      <body>
        <ApolloProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
```

Note: `ApolloProvider` must be a `'use client'` wrapper component since Apollo requires client context. Create `src/lib/graphql/ApolloProvider.tsx` as the client component wrapper.

### `src/app/page.tsx` (HomePage)
Server Component. A landing page with:
- Full-viewport hero: title "Valkária" in Cinzel, subtitle "A cidade de Candessah aguarda", two CTA buttons ("Entrar" → `/auth/login`, "Criar Personagem" → `/auth/register`)
- Brief description of the world
- `ParticleCanvas` component for atmosphere

### `src/components/layout/Navbar.tsx`
`'use client'` component. Shows:
- Left: `⚔ Valkária` logo (Cinzel font, gold)
- Center: nav links (World → `/world`, only when authenticated)
- Right: player name + logout OR "Entrar" button

Reads from `AuthContext`. Sticky, `backdrop-blur-sm`, `bg-void/80` background.

### `src/components/background/ParticleCanvas.tsx`
`'use client'` lightweight canvas animation. ~20 particles floating upward, gold/purple tint, opacity 0.3. Implement with `requestAnimationFrame`, keep CPU usage ≤ 1% (check with browser DevTools). Position: `fixed inset-0 pointer-events-none z-0`.

### `src/components/layout/PageTransition.tsx`
```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

### `src/lib/graphql/client.ts`
See `spec/agents/web-ui.md` for the Apollo Client setup with auth link and JWT header injection.

### `src/lib/auth/AuthContext.tsx`
`'use client'` component. Manages JWT storage (memory + localStorage), player state, DM flag. Exports `useAuth()` hook.

### `src/lib/utils.ts`
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `next.config.ts`
```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { reactCompiler: false },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  },
}

export default config
```

---

## Key implementation notes

1. Google Fonts (`Cinzel`, `Inter`) via `next/font/google` — zero layout shift, self-hosted by Next.js.
2. `ApolloProvider` must be a separate `'use client'` file because `layout.tsx` is a Server Component — you can't use hooks in it directly.
3. `ParticleCanvas` must use `useEffect` + cleanup (`cancelAnimationFrame`) to avoid memory leaks on unmount.
4. shadcn components need their CSS variables overridden in `globals.css` to match the dark fantasy palette — the `@layer base { :root { ... } }` block handles this.
5. Add `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"` to `apps/web/package.json` scripts.

---

## Environment variables needed

```
NEXT_PUBLIC_API_URL=http://localhost:80
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:80/graphql
```

---

## Acceptance check

```bash
npm run dev -w @valkaria/web
```

Open `http://localhost:3000`. Verify:
- Dark purple/void background renders
- `Valkária` in Cinzel font visible
- Navbar appears with "Entrar" button
- Particle canvas animating (subtle, not distracting)
- No console errors
- `npm run typecheck` passes for `@valkaria/web`
