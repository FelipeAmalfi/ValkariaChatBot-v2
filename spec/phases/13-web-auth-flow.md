# Phase 13 — Web Auth Flow

**Agent**: `web-ui`  
**Depends on**: Phase 12, 04  
**Service**: `apps/web/`

---

## What you're building

The complete authentication user experience: a 4-step registration wizard, a narrative login challenge flow, and a minimal DM login page. After this phase, players can create characters and authenticate.

---

## Directory structure

```
apps/web/src/
├── app/
│   └── auth/
│       ├── register/
│       │   └── page.tsx       4-step wizard
│       ├── login/
│       │   └── page.tsx       Narrative challenge flow
│       └── dm/
│           └── page.tsx       DM password login
├── components/
│   └── auth/
│       ├── RegisterWizard.tsx
│       ├── WizardStep.tsx
│       ├── LoginChallenge.tsx
│       └── StepIndicator.tsx
└── lib/
    └── graphql/
        └── mutations/
            └── auth.ts        GraphQL mutation definitions
```

---

## GraphQL mutations

### `src/lib/graphql/mutations/auth.ts`
```typescript
import { gql } from '@apollo/client'

export const REGISTER_PLAYER = gql`
  mutation RegisterPlayer(
    $name: String!
    $class: String!
    $race: String!
    $background: String!
    $personality: String!
    $interests: String!
  ) {
    registerPlayer(
      name: $name
      class: $class
      race: $race
      background: $background
      personality: $personality
      interests: $interests
    ) {
      id
      name
    }
  }
`

export const INITIATE_AUTH = gql`
  mutation InitiatePlayerAuth($playerName: String!) {
    initiatePlayerAuth(playerName: $playerName) {
      challengeId
      question
    }
  }
`

export const VERIFY_AUTH = gql`
  mutation VerifyPlayerAuth($challengeId: String!, $answer: String!) {
    verifyPlayerAuth(challengeId: $challengeId, answer: $answer) {
      token
      player {
        id
        name
        class
        race
      }
    }
  }
`

export const AUTHENTICATE_DM = gql`
  mutation AuthenticateDM($password: String!) {
    authenticateDM(password: $password) {
      token
    }
  }
`
```

---

## Pages to create

### `src/app/auth/register/page.tsx`
Server Component shell. Renders `<RegisterWizard />` (client component) inside `<PageTransition>`.

### `src/components/auth/RegisterWizard.tsx`
`'use client'` — 4-step wizard with animated step transitions.

**State**: `currentStep: 1|2|3|4`, form fields per step, `useMutation(REGISTER_PLAYER)`.

**Step 1 — Character identity** (`name`, `class`, `race`):
- Text input for name
- Select for class: `['Guerreiro', 'Mago', 'Ladino', 'Clérigo', 'Bárbaro', 'Bardo', 'Druida', 'Paladino', 'Ranger']`
- Select for race: `['Humano', 'Elfo', 'Anão', 'Halfling', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Tiefling', 'Draconato']`

**Step 2 — Background** (`background`): Large textarea. Placeholder: "Descreva a história de seu personagem...". Min 50 chars.

**Step 3 — Personality** (`personality`): Large textarea. Placeholder: "Como seu personagem age e pensa?". Min 30 chars.

**Step 4 — Interests** (`interests`): Large textarea. Placeholder: "O que seu personagem aprecia? (combate, magia, comércio...)". Min 20 chars.

After step 4: call `REGISTER_PLAYER`, then redirect to `/auth/login?name=<playerName>`.

**Animations**: Each step slides in from the right (entering) or left (going back):
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 24 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -24 }}
    transition={{ duration: 0.25 }}
  >
    <WizardStep ... />
  </motion.div>
</AnimatePresence>
```

### `src/components/auth/StepIndicator.tsx`
4 dots: filled gold for completed steps, outlined for future steps, pulsing for current.
```tsx
{[1,2,3,4].map(step => (
  <div key={step} className={cn(
    'w-2 h-2 rounded-full transition-all duration-300',
    step < currentStep ? 'bg-gold scale-100' :
    step === currentStep ? 'bg-gold scale-125 ring-2 ring-gold/30' :
    'bg-mist'
  )} />
))}
```

### `src/app/auth/login/page.tsx`
Server Component shell with `<LoginChallenge />`.

### `src/components/auth/LoginChallenge.tsx`
`'use client'` — 3-phase flow:

**Phase 1 — Name input**: Player types their name, clicks "Entrar". Calls `INITIATE_AUTH`.

**Phase 2 — Challenge**: Shows the narrative question in a styled card. Large textarea for the answer. Gold border, italic text for the question. "Responder" button calls `VERIFY_AUTH`.

**Phase 3 — Result**: 
- Success: `auth.login(token, player)` → redirect to `/chat`
- Failure: show red message "Identidade não confirmada. Tente novamente." → back to phase 1

The transition between phases uses `AnimatePresence` — each phase fades in.

Question display:
```tsx
<div className="border border-gold/30 rounded-lg p-6 bg-night/50">
  <p className="text-silver text-sm mb-2 font-display">O narrador pergunta:</p>
  <p className="text-parchment italic text-lg">"{challenge.question}"</p>
</div>
```

### `src/app/auth/dm/page.tsx`
`'use client'` minimal page:
- Password input (type="password")
- "Entrar como Mestre" button
- Calls `AUTHENTICATE_DM`
- On success: `auth.loginAsDM(token)` → redirect to `/dm`
- Smaller, less decorated than player auth — DM knows the password, no narrative needed

---

## Redirect guard

Update `AuthContext` to expose a `RequireAuth` component or `useRequireAuth` hook that redirects to `/auth/login` if the user is not authenticated. Use it in later pages (chat, profile, dm).

```typescript
// src/lib/auth/useRequireAuth.ts
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'

export function useRequireAuth() {
  const { token } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!token) router.push('/auth/login')
  }, [token, router])
  
  return !!token
}
```

---

## Key implementation notes

1. The wizard form state lives entirely in `RegisterWizard` — no global state, no URL params per step.
2. On registration failure (name conflict): show inline error "Este nome já está em uso" without leaving the wizard.
3. Pre-fill the name field in `LoginChallenge` if `?name=<name>` URL param is present (from registration redirect).
4. `VERIFY_AUTH` returns `{ token, player }` — store both in AuthContext. The `player` object is decoded from the token, so you could also decode the JWT client-side.
5. Never store passwords in state — the DM password is only held in the input element until submission.

---

## Acceptance check

Manual browser test:
1. Navigate to `/auth/register` — wizard renders with step indicator
2. Complete all 4 steps — each step animates correctly
3. After step 4: redirects to `/auth/login?name=<playerName>`
4. Login page shows name prefilled — click "Entrar"
5. Challenge question appears with narrative styling
6. Type a relevant answer — success redirects to `/chat`
7. Navigate to `/auth/dm`, enter DM password — redirects to `/dm`
