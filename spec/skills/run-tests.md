---
name: run-tests
description: Run the Vitest test suite and report results. Use after each backend phase to verify implementations. Can target a specific workspace or run all.
---

## Purpose
Run automated tests and surface failures with enough detail to fix them immediately.

## Invocation variants

**All tests:**
```bash
npm test
```

**Single service:**
```bash
npm test -w @valkaria/auth-service
npm test -w @valkaria/chat-service
npm test -w @valkaria/world-service
```

**Watch mode (during development):**
```bash
npm run test:watch -w @valkaria/chat-service
```

## Steps

1. Run the appropriate test command.

2. Parse Vitest output. Key patterns:
   - `✓ test name (Xms)` — passing
   - `✗ test name` — failing
   - `× N tests failed` — failure count
   - Error blocks start with `AssertionError:` or the thrown exception

3. Report format:
```
Test Results: @valkaria/auth-service
  ✓ 23 passed
  ✗ 2 failed
  
  FAILED: Auth flow › player auth › validates semantic similarity
    File: tests/integration/auth.test.ts:48
    Expected: received 401, but got 200
    Diff: cosine similarity 0.45 did not meet threshold 0.6
  
  FAILED: Auth flow › dm auth › rejects wrong password  
    File: tests/integration/auth.test.ts:67
    AssertionError: expected 200, received 401
```

4. **If all pass:**
```
Test Results: @valkaria/auth-service
  ✓ 23/23 passed (4.2s)
```

5. **If Vitest fails to start** (import error, module not found): report the startup error verbatim — it's more useful than a test result.

## Notes
- Integration tests require Docker infrastructure running. Run `docker compose up -d` first.
- Unit tests in `tests/unit/` run without Docker.
- Never run `npx vitest` directly — always use `npm test -w <workspace>` to get the turborepo-cached run.
- Test files must end in `.test.ts` or `.spec.ts` to be picked up by vitest.
