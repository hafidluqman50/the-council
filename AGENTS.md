# The Council — Agent Context, Architecture & Repository Rules

> [!IMPORTANT]
> This document is the single, authoritative source of truth for all AI agents, subagents, and developers working on The Council repository. All constraints, boundaries, and sequence rules outlined here are **ABSOLUTE, STRICT, AND NON-NEGOTIABLE**.

---

## 1. Directory Infrastructure & Zero-Tolerance Boundary Policy

Never violate the repository directory structure or place files in unauthorized directories.

### 1.1 Backend (`backend/`)

- **`backend/src/`**: **STRICTLY PRODUCTION CODE ONLY**.
  - **ABSOLUTELY FORBIDDEN** to place test files (`*.test.ts`, `*.spec.ts`), temporary scripts, scratch files, or mocks inside `backend/src/` (including `backend/src/service/...`, `backend/src/http/...`, `backend/src/repository/...`, `backend/src/model/...`).
  - There are zero exceptions for any reason.
- **`backend/test/`**: **ALL TESTS LIVE HERE**. Mirror the `src/` path under `test/` — a test for `src/service/agent/council-graph.ts` belongs at `test/service/agent/council-graph.test.ts`.
- **`backend/migrations/`**: numbered raw SQL migrations (`001_initial_schema.sql`, ...), applied in order by `backend/scripts/migrate.ts`. Never edit an already-applied migration file; add a new numbered one instead.

### 1.2 Frontend (`frontend/`)

- **`frontend/app/`**, **`frontend/components/`**, **`frontend/http/`**, **`frontend/lib/`**, **`frontend/contexts/`**: production routes, components, API clients, and hooks.
- Frontend test files are strictly restricted to `frontend/__tests__/`.
- `frontend/AGENTS.md` is generated and re-added by `next dev`. Do not delete it; commit it with your work.

### 1.3 Smart Contract (`smart-contract/`)

- **`smart-contract/src/`**: production Solidity source only.
- **`smart-contract/test/`**: ALL Foundry test files (`*.t.sol`) MUST reside here.
- **`smart-contract/script/`**: deployment and operational scripts (`*.s.sol`).
- Do not edit anything under `smart-contract/lib/**`. Treat `forge-std` and `openzeppelin-contracts` as read-only vendored dependencies.

### 1.4 Documentation & Workplanning (`docs/`)

- **`docs/plans/`**: work plans, architectural specifications, and technical changelogs. One file per feature, kebab-case (`docs/plans/council-debate-engine.md`).

---

## 2. Strict Workplanning Sequence: Docs → Implementation

**MANDATORY EXECUTION SEQUENCE (CANNOT BE ALTERED):**

1. **Update Docs First.** Every feature, bug fix, prompt adjustment, or architectural change MUST be documented FIRST in the relevant plan under `docs/plans/` — including bumping the document version and adding a changelog row.
2. **Implementation Second.** Only after the documentation is updated and aligned may production code change.
3. **Never touch or modify code before the documentation is updated.**

---

## 3. Toolchain & Package Manager

- **Bun is the package manager for both `backend/` and `frontend/`.** Never run `npm install`, `yarn`, or `pnpm` in this repo. Use `bun install`, `bun add`, `bun run <script>`.
- **Foundry** drives `smart-contract/`: `forge build`, `forge test`, `forge script`.
- Solidity is pinned to `0.8.28` in `foundry.toml`. Do not float the pragma above the pinned compiler.

---

## 4. Code Conventions

### 4.1 English-only identifiers

All code identifiers — variables, functions, types, tables, columns, contract members — are **English only**, with no abbreviations. Write `marketAnalystVerdict`, not `verdictMA` or `putusanAnalis`.

### 4.2 Comments: default to none

Code explains itself through naming and structure. Do not write comments that narrate what the line below does, restate a function's name, or document types already present in the signature.

The **only** exception is a *why* that cannot be inferred from the code and would cause the next person to change it incorrectly — a deliberate trade-off, a workaround for a third-party bug, or a business rule that looks wrong at a glance. One short sentence, explaining the reason rather than the mechanism.

### 4.3 Product copy is English

The Council is a global product. All UI chrome, button labels, empty states, documentation, and error messages are written in English.

This includes agent-generated debate content. **The five council agents always reason and write in English, regardless of the submitter's language.** Decided 2026-09-23: prompt quality and citation discipline degrade noticeably on smaller models when they are also asked to mirror a language, and a consistent language keeps verdicts comparable across threads.

### 4.4 Non-agentic errors are always English

Smart contract reverts, RPC and network failures, database errors, wallet errors, and transaction toasts remain in standard English regardless of any agent-language decision.

---

## 5. Frontend Contract Simulation (`simulateContract`)

Every on-chain write from the frontend MUST be pre-flight simulated:

```typescript
const { request } = await publicClient.simulateContract({ ... });
await writeContractAsync(request);
```

Calling `writeContractAsync` directly without simulation is strictly prohibited. Catch and format simulation errors cleanly *before* triggering the wallet confirmation popup.

---

## 6. Project Core Philosophy

The Council is an adversarial idea-validation forum on BNB Chain. A user submits a business or project idea **together with their own research**; a panel of AI agents cross-examines it in public and the finished exchange is published on-chain.

### Fundamental Rules

- **Adversarial by construction, not cooperative.** The three Market Analysts are required to attack each other's positions, and the Tech Validator is required to attack the market panel's converged conclusion. An agent that agrees without first testing the claim has failed its role.
- **Evidence or it does not count.** Every substantive claim an agent makes carries a citation. The council is explicitly harder on claims the submitter brought without research.
- **A verdict names what is still unproven.** The Orchestrator's closing verdict must state the remaining gap, not just a score. "Conditional Pass / Demand Unproven" is a better outcome than an unqualified pass.
- **The thread is the artifact.** The full debate — every rebuttal, every citation — is what gets attested on-chain, not just the final score.

### Agent Roles

| Key | Agent | Mandate |
|---|---|---|
| `orc` | The Orchestrator | Set speaking order, close each round, write the verdict |
| `m1` | Market Analyst α | Demand — is there real, sized demand on-chain |
| `m2` | Market Analyst β | Token economics and pricing — does the model hold, will anyone pay |
| `m3` | Market Analyst γ | Distribution and GTM — how does this reach users in this ecosystem |
| `tech` | Tech Validator | Is the on-chain architecture buildable, at what cost and what timeline |

Round 1 is the market panel arguing among itself until it reaches a shared position. Round 2 hands that position to the Tech Validator, who attacks it. The Orchestrator closes.

> [!IMPORTANT]
> **Mandates are Web3-native, not generic business-idea mandates.** Decided 2026-09-23 in `docs/plans/council-mvp.md` v2.0 — the product targets Web3 builders specifically. Fixed two rounds, no convergence loop; see that plan's §4.3 for why dynamic rounds were cut for the 7-day deadline.

---

## 7. Architecture & System Design

### 7.1 Backend (`backend/`)

Bun + Elysia + TypeScript · LangGraph for agent orchestration · PostgreSQL + Sequelize · native Elysia WebSocket for streaming debate turns to the client · viem for chain reads and writes.

```
backend/
├── main.ts
├── migrations/        # numbered raw SQL, applied by scripts/migrate.ts
├── scripts/           # migrate.ts and other one-off operational scripts
├── src/
│   ├── app/           # Elysia app composition
│   ├── config/        # env.ts (env loading) and database.ts (Sequelize instance) — kept separate
│   ├── http/
│   │   ├── controllers/  # parse request, call service, return response
│   │   ├── middleware/
│   │   ├── response/     # success/failure envelopes
│   │   └── routes/
│   ├── logger/
│   ├── model/         # Sequelize models — declarative fields and associations only, no business logic
│   ├── repository/    # data access only, built on the models above
│   └── service/
│       ├── agent/     # LangGraph council graph, node definitions, prompts
│       ├── chain/     # viem clients, registry reads/writes
│       └── realtime/  # WebSocket fan-out
└── test/              # mirrors src/
```

Layering follows the same separation of concerns as the rest of this document's SOLID guidance: controllers stay thin, services hold business logic, repositories hold only queries built on Sequelize models, and models hold fields, casts, and associations — never business rules.

### 7.2 Frontend (`frontend/`)

Next.js App Router + TailwindCSS v4 + wagmi + RainbowKit.

- Design tokens live in `app/globals.css` under `@theme` and are derived 1:1 from the approved light design. Do not introduce ad-hoc hex values in components; add a token instead.
- Fonts: **Outfit** for display/headings, **Inter** for body, **JetBrains Mono** for hashes, scores, and metrics.

### 7.3 Smart Contract (`smart-contract/`)

Foundry + Solidity on BNB Chain. Agent identity, reputation, and report attestation build on ERC-8004; thread access is paid via an x402 rail.

> [!IMPORTANT]
> **What is reused from canonical ERC-8004 deployments versus what we deploy ourselves is decided in `docs/plans/`, not improvised in code.** Do not write a registry contract before the relevant plan records that decision and the verified BNB Chain addresses.

---

## 8. Planning Mode Guidelines

1. **No code during Planning Mode.** Do not modify code or run state-changing commands until the user has approved the plan.
2. **Version every plan document — zero tolerance.**

   > [!CAUTION]
   > **ABSOLUTE, ZERO-TOLERANCE RULE: every single edit to a plan document bumps the version and adds a changelog row. No exceptions, no matter how small.**
   > This applies to a wording tweak, a corrected field name, a fixed line in a wireframe, a reordered question, a one-sentence clarification — anything, however minor. A plan document with an edit that has no matching changelog row is a broken audit trail, full stop. If you are unsure whether something counts as an edit, it counts.

   - Bump MINOR for any content revision. Bump MAJOR only when the approach or scope changes enough that the prior plan is no longer valid.
   - Every changelog row states which section changed and what changed in it, specific enough that a reader never has to diff the file.

3. **English only.** Plan documents are written entirely in English.
4. **Required sections:** Problem Statement, Definition of Done, Feature Description, Impacted Files, UI/UX Changes (Lo-Fi), Flowchart, Verification Plan.
5. **Header format**, immediately followed by the changelog table (present from `1.0` onward):

   ```markdown
   # <Feature Name>

   | | |
   |---|---|
   | **Version** | 1.0 |
   | **Status** | Draft |
   | **Date Created** | YYYY-MM-DD |
   | **Last Updated** | YYYY-MM-DD |

   | Version | Date | Change |
   |---|---|---|
   | 1.0 | YYYY-MM-DD | Initial draft |
   ```

---

## 9. Git Discipline

- **Never run `git commit` or `git push` without an explicit request from the user.** Staging and committing on your own initiative is prohibited even when the work is finished.
- New branches are cut from `main`. Never rename or branch off an existing feature branch.
- Never use `--no-verify` or bypass signing.
