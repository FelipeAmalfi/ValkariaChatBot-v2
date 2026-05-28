---
name: typecheck
description: Run TypeScript type checking across all workspaces and report errors grouped by file. Use after implementing any phase to catch type errors before proceeding.
---

## Purpose
Verify that TypeScript types are correct across the entire monorepo. Run this at the end of every phase before moving to the next one.

## Steps

1. Run typecheck from the repo root:
```bash
npm run typecheck
```

2. Parse the output. TypeScript errors follow the pattern:
```
path/to/file.ts(line,col): error TS1234: message
```

3. Group errors by file. For each file with errors, report:
   - File path (relative to repo root)
   - Number of errors in that file
   - First error message only

4. **Report format:**
```
TypeCheck Results:
  ✗ 12 errors across 3 files
  
  packages/domain/src/entities/Character.ts (1 error)
    Line 12: Property 'metadata' is missing in type...
  
  services/chat-service/src/interface/graph/state.ts (8 errors)
    Line 45: Type 'string' is not assignable to type 'IntentType'...
  
  apps/web/src/components/ChatWindow.tsx (3 errors)
    Line 23: Property 'onSend' does not exist...
```

5. **Stop condition:** If errors > 50, report "Systemic type error detected — likely a missing package or broken import" and stop. Do not attempt to fix all 50+ errors individually — find the root cause.

6. **Success:**
```
TypeCheck Results:
  ✓ 0 errors — all workspaces clean
```

## Notes
- Run `npm run typecheck` NOT `npx tsc --noEmit` — the turbo-powered script runs all workspaces in the correct dependency order.
- Type errors in `packages/domain/` will cascade to all services — fix domain errors first.
- `skipLibCheck: true` in tsconfig means external library type errors are ignored.
