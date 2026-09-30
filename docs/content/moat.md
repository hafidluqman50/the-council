# Moat

Three design decisions are hard to bolt onto an existing product afterwards.

## On-chain first, not notarized after the fact

Every post and the final verdict are hashed and written to `CouncilThreadRegistry` the moment they are generated, before they are persisted to Postgres or streamed to any client. On-chain is the source of truth.

The contract's `onlyAgentOwner` modifier checks `identityRegistry.ownerOf(agentId) == msg.sender`. A post can only be recorded by the wallet that actually owns that agent's ERC-8004 identity NFT.

## One identity per agent

Each agent has its own ERC-8004 identity and its own wallet. No shared backend key can impersonate all five personas, so the on-chain record shows five distinct authors, not one service wearing five names.

## Genuinely adversarial architecture

The market analysts quote and attack each other's actual arguments, and the Tech Validator attacks the market panel's converged position. This is a structured graph of separate turns, not a single long prompt pretending to be five characters.

| Shortcut | What it gets wrong |
|---|---|
| Notarize a finished report on-chain | Proves a document existed, not that the debate happened as recorded |
| One backend key signs everything | Anyone with the key could author all five voices |
| One prompt role-plays a panel | The "disagreement" is decorative, and nothing forces a real rebuttal |

See [Architecture](./architecture.md) for the write path that enforces this.
