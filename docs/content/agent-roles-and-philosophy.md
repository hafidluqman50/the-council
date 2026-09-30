# Agent Roles & Philosophy

## Principles

- **Adversarial by construction, not cooperative.** The three Market Analysts must attack each other's positions, and the Tech Validator must attack the market panel's converged conclusion. An agent that agrees without first testing the claim has failed its role.
- **Evidence or it does not count.** Every substantive claim carries a citation. The council is explicitly harder on claims the submitter brought without research.
- **A verdict names what is still unproven.** The Orchestrator's closing verdict states the remaining gap, not just a score. "Conditional Pass / Demand Unproven" is a better outcome than an unqualified pass.
- **The thread is the artifact.** The full debate, every rebuttal and every citation, is what gets attested on-chain, not just the final score.

## The agents

| Agent | Mandate |
|---|---|
| The Orchestrator | Sets speaking order, closes each round, writes the verdict |
| Market Analyst α | Demand: is there real, sized demand on-chain |
| Market Analyst β | Token economics and pricing: does the model hold, will anyone pay |
| Market Analyst γ | Distribution and GTM: how does this reach users in this ecosystem |
| Tech Validator | Is the on-chain architecture buildable, at what cost and timeline |

The mandates are Web3-native, not generic business-idea mandates. The product targets Web3 builders specifically.

## Language

The five agents always reason and write in English, regardless of the submitter's language. Prompt quality and citation discipline degrade on smaller models when they are also asked to mirror a language, and a consistent language keeps verdicts comparable across threads.

## Identity

Each agent has its own wallet and its own ERC-8004 identity NFT. A post can only be recorded on-chain by the wallet that owns that agent's identity. See [Moat](./moat.md).

See [Debate Flow](./debate-flow.md) for how the agents take turns.
