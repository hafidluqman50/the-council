# Frontend Data Layer: TanStack Query (Rombak)

| | |
|---|---|
| **Version** | 1.2 |
| **Status** | Implemented |
| **Date Created** | 2026-09-25 |
| **Last Updated** | 2026-09-25 |

| Version | Date | Change |
|---|---|---|
| 1.2 | 2026-09-25 | `useCreateThreadMutation` rewritten so the on-chain leg (allowance check, `approve()`, EIP-712 `signTypedDataAsync`) lives inside the hook itself, ahead of the backend `POST /threads` call in the same `mutationFn` — on-chain first, then backend, as one hook. `NewThreadComposer` no longer holds any payment/stage/error logic locally (`buildPayment`, `randomNonce`, `ERC20_ABI`, local `stage`/`error` state all deleted from the component) — it only reads `{stage, isPending, isError, error}` off the mutation and calls `.mutate()`. The hook's own `onSuccess` keeps doing `invalidateQueries(["threads"])`; the component's own per-call `onSuccess` (passed to `mutate()`) handles the reset-and-redirect, since that's component-specific and shouldn't live in the shared hook. `typecheck`/`lint`/`build` all clean. |
| 1.1 | 2026-09-25 | Implemented in full. Added `useThreadsQuery`, `useThreadQuery` (with the WebSocket now writing into the query cache via `setQueryData` instead of local `useState`), `usePaymentRequirementsQuery`, `useCreateThreadMutation`, `useMintThreadMutation`. Rewrote `ThreadList`, `NewThreadComposer`, `ThreadView` to use them exclusively — confirmed via grep that no Client Component calls `http/threads.ts` functions directly anymore, only the three Server Components (for `initialData`) still do. `typecheck`/`lint`/`build` all clean; confirmed both `/forum` and `/` still render correctly against the live dev server. This also fully replaces the earlier `router.refresh()` workaround for the "list doesn't update after creating a thread" bug — the mutation's `onSuccess` now invalidates the `["threads"]` query directly, which is the actual correct fix that workaround was standing in for. |
| 1.0 | 2026-09-25 | Initial draft |

> **Summary.** Every piece of frontend data fetching today is a hand-rolled `fetch()` call wrapped in manual `useState`/`useEffect` (forum list filtering, thread creation, minting, live thread state). `@tanstack/react-query` has been installed and provided at the root since the very first commit (`Web3Provider`), but only ever used for RainbowKit's own internals — never for this app's own data. This replaces every manual fetch/state pattern with `useQuery`/`useMutation`, including funneling the WebSocket-driven live thread updates through the query cache (`queryClient.setQueryData`) instead of local component state, so there's one consistent caching/invalidation model everywhere, not two.

---

## 1. Problem Statement

Manual fetch + `useState` scattered across `ThreadList`, `NewThreadComposer`, and `ThreadView` means every one of them re-invents loading states, has no shared cache, and has no consistent invalidation story — exactly what caused the "list doesn't update after creating a thread" bug fixed last, patched with a `router.refresh()` workaround instead of the real fix.

---

## 2. Business Rules

- No component calls `http/threads.ts` functions directly anymore — they're only ever called from inside a `useQuery`/`useMutation` `queryFn`/`mutationFn`.
- Query keys are structured (`["threads", filter]`, `["thread", publicRef]`, `["payment-requirements"]`) so invalidation can target precisely (e.g. invalidate all `["threads", *]` after creating one, without touching an open thread detail view).
- The WebSocket in `ThreadView` no longer owns its own `useState` copy of the thread — every incoming message (`post`, `verdict`, `error`) updates the query cache directly via `queryClient.setQueryData(["thread", publicRef], ...)`, so the cache is the single source of truth whether the update came from a fetch or a socket push.
- Server Components (`app/page.tsx`, `app/forum/page.tsx`, `app/forum/[publicRef]/page.tsx`) keep doing their initial server-side fetch directly (no client-side query hook exists on the server) — but hand that data to the client tree as `initialData` for the matching query, so there's no duplicate fetch on mount.

---

## 3. Approach / Solution Overview

Reuse the existing `QueryClientProvider` from `Web3Provider` (already wraps the whole app) — no second `QueryClient` instance. Add one hooks file per resource under `frontend/hooks/`, each a thin wrapper pairing a query key with the existing `http/threads.ts` functions (kept as-is; they remain the actual fetch implementations, just never called directly by components anymore).

| Option | Pros | Cons |
|---|---|---|
| **`useQuery`/`useMutation` wrapping the existing `http/threads.ts` functions** (chosen) | Minimal churn to the fetch layer itself; centralizes caching/invalidation/loading state | None significant |
| Rewrite fetch logic inline inside each hook | — | Duplicates what `http/threads.ts` already does correctly |

---

## 4. Impacted Files / Components

| Layer | File | Action |
|---|---|---|
| Frontend | `frontend/hooks/useThreads.ts` | NEW — `useThreadsQuery(filter)` |
| Frontend | `frontend/hooks/useThread.ts` | NEW — `useThreadQuery(publicRef, initialData)`, plus the WS-to-cache wiring |
| Frontend | `frontend/hooks/usePaymentRequirements.ts` | NEW — `usePaymentRequirementsQuery()` |
| Frontend | `frontend/hooks/useCreateThread.ts` | NEW — `useCreateThreadMutation()`, invalidates `["threads"]` on success |
| Frontend | `frontend/hooks/useMintThread.ts` | NEW — `useMintThreadMutation()`, updates the `["thread", publicRef]` cache entry directly on success |
| Frontend | `components/forum/thread-list.tsx` | MODIFY — replace manual fetch/state with `useThreadsQuery` |
| Frontend | `components/forum/new-thread-composer.tsx` | MODIFY — replace manual fetch calls with `useCreateThreadMutation`/`usePaymentRequirementsQuery` |
| Frontend | `components/thread/thread-view.tsx` | MODIFY — replace local `useState(initialThread)` + manual WS handling with `useThreadQuery` + `setQueryData`; mint button uses `useMintThreadMutation` |

---

## 5. Verification Plan

### Manual verification

1. `bun run typecheck`, `lint`, `build` clean.
2. Submit a thread from the browser; forum list updates without any `router.refresh()`/manual reload, purely from query invalidation.
3. Open a thread mid-debate; confirm the WebSocket-driven post/verdict updates still render live, now via the query cache instead of local state.
4. Mint a finished thread from the browser; confirm the UI updates from the mutation's cache write, no page reload.
