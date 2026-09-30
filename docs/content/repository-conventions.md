# Repository Conventions

These are the rules contributors, human or AI, follow when changing the repository.

## Docs before code

Every feature, bug fix, prompt adjustment, or architectural change is documented first in the relevant plan under `docs/plans/`. Each plan edit bumps the document version and adds a changelog row. Production code changes only after that.

## Directory boundaries

| Package | Production code | Tests |
|---|---|---|
| `backend/` | `backend/src/` only, no test or scratch files | `backend/test/`, mirroring the `src/` path |
| `frontend/` | `app/`, `components/`, `http/`, `lib/`, `contexts/` | `frontend/__tests__/` |
| `smart-contract/` | `smart-contract/src/` | `smart-contract/test/` (`*.t.sol`), scripts in `script/` |

Database migrations are numbered raw SQL files in `backend/migrations/`. An applied migration is never edited. A new numbered one is added instead. Vendored libraries under `smart-contract/lib/` are read-only.

## Toolchain

- Bun is the package manager for `backend/`, `frontend/`, and `docs/`. Do not use npm, yarn, or pnpm.
- Foundry drives `smart-contract/`, pinned to Solidity `0.8.28`.

## Code

- Identifiers are English only and never abbreviated, for example `marketAnalystVerdict`, not `verdictMA`.
- Comments default to none. A comment is allowed only for a *why* that the code cannot express.
- Product copy, documentation, and error messages are in English.
- Design tokens live in `frontend/app/globals.css` under `@theme`. Add a token instead of an ad-hoc hex value.

## On-chain writes

Every on-chain write from the frontend is simulated first with `publicClient.simulateContract`, and simulation errors are formatted before the wallet prompt opens. Calling `writeContractAsync` without a simulation is not allowed.

## Git

- Commits and pushes happen only on an explicit request.
- New branches are cut from `main`.
- Hooks and signing are never bypassed.
