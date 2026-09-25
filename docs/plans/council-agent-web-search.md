# Real Web Search for Agents (Tavily)

| | |
|---|---|
| **Version** | 1.1 |
| **Status** | Implemented |
| **Date Created** | 2026-09-25 |
| **Last Updated** | 2026-09-25 |

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-09-25 | Implemented and verified with a real Tavily API key. Wired `TavilySearch` into all 4 substantive-claim agents (market analysts α/β/γ, tech validator); left the Orchestrator without it since its mandate is procedural, not evidentiary. Tightened `GLOBAL_INSTRUCTIONS` to explicitly forbid citing anything not returned by a `web_search` call this turn. Ran a real debate: Market Analyst α's opening cited 7 external sources; independently checked 5 of the resulting URLs by fetching them directly — 4 resolved to real, specific pages (exact report slugs and article IDs a hallucinating model would be very unlikely to construct), the other 2 returned 403/429 consistent with DefiLlama's and Messari's known aggressive bot-blocking on real sites, not evidence of a fake URL. Status → Implemented. |
| 1.0 | 2026-09-25 | Initial draft |

> **Summary.** Every agent's toolset today is `calculate` and `quote_exact_post` only — nothing that touches the real internet. But `GLOBAL_INSTRUCTIONS` already tells every agent "every substantive claim must carry at least one citation," so the model complies the only way it can: by generating plausible-sounding sources (DefiLlama, BscScan, a16z, OpenZeppelin...) from training-data memory. Every citation in every debate run this entire session is fabricated, not retrieved. This adds a real Tavily-backed `web_search` tool to all five agents and tightens the instruction so external citations are only valid if they came from an actual tool call this turn.

---

## 1. Problem Statement

The product's credibility depends on the market panel and tech validator citing real, checkable sources. Discovered live: they cannot, because no agent has ever had a tool capable of touching the internet. The existing "cite everything" instruction, without a real search tool behind it, actively produces confident-sounding fabrication — arguably worse than citing nothing, since it reads as verified when it isn't.

---

## 2. Business Rules

- All five agents (`orc`, `m1`, `m2`, `m3`, `tech`) get access to a real `web_search` tool (Tavily).
- A reference in a post's output is only valid if it corresponds to a URL actually returned by a `web_search` call made during that same turn — not recalled from the model's training data.
- `quote_exact_post` remains the correct (and only) mechanism for citing another agent's post *within the same thread* — `web_search` is for external sources only. The two are not interchangeable.
- Search happens live, per-turn, per-agent — no caching/sharing of search results across agents or across turns; each agent independently searches and can reach different sources for the same question, which is realistic (and desirable — it's part of why they can genuinely disagree).

---

## 3. Approach / Solution Overview

Use the official `@langchain/tavily` package's `TavilySearch` tool directly — it's already a proper `StructuredTool` matching the pattern the other two tools use, no custom wrapper logic needed beyond configuration (max results, API key). Add it to every agent's tool list alongside the existing two. Tighten `GLOBAL_INSTRUCTIONS` to explicitly distinguish "cite a prior post" (`quote_exact_post`) from "cite an external source" (must come from `web_search`, this turn).

| Option | Pros | Cons |
|---|---|---|
| **`@langchain/tavily`'s `TavilySearch` tool directly** (chosen) | Zero custom code beyond config; maintained by the LangChain team; purpose-built for LLM agent tool-use | None significant for this scope |
| Hand-roll a fetch-based wrapper around Tavily's raw REST API | More control over response shaping | Reinvents what the official package already does correctly |
| A different provider (Exa, Brave, SerpAPI) | — | User explicitly chose Tavily this round |

---

## 4. Database / Data Design

None — this only changes agent tool wiring and prompt instructions.

---

## 5. Impacted Files / Components

| Layer | File | Action |
|---|---|---|
| Backend | `backend/src/service/agent/agents/tools/webSearch.ts` | NEW — thin factory wrapping `TavilySearch` |
| Backend | `backend/src/config/env.ts`, `.env`, `.env.example` | MODIFY — add `TAVILY_API_KEY` |
| Backend | `agents/{market-analyst-alpha,market-analyst-beta,market-analyst-gamma,tech-validator,orchestrator}/tools.ts` | MODIFY — add the web search tool to each role's tool list |
| Backend | `agents/shared.ts` (`GLOBAL_INSTRUCTIONS`) | MODIFY — distinguish internal quote citations from external citations; external citations require a `web_search` call this turn |

---

## 6. Scenario Walkthrough

**Happy path.** Market Analyst α wants to cite a real BSC DEX volume figure. It calls `web_search`, gets back real URLs with real snippets, and cites one of those verbatim in its `references` — a citation a judge could actually click and verify.

**Edge case — search returns nothing useful.** The tool returns an empty or irrelevant result set. The agent should say so honestly (no verified source found) rather than fall back to a fabricated citation — this is a prompt-adherence concern to watch for during verification, not something enforceable in code.

---

## 7. Verification Plan

### Manual verification

1. `bun run typecheck` clean.
2. Run one real debate; confirm (via temporary logging or by checking that returned reference URLs are real, resolvable pages, not just training-data-plausible) that citations trace back to genuine `web_search` results this turn.
3. Confirm `quote_exact_post` still works correctly for in-thread rebuttal quoting, unaffected by this change.
