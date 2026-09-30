# Getting Started

The repository has three runnable parts: the smart contracts, the backend API, and the frontend. Each is an independent package with its own dependencies. The JavaScript packages use [Bun](https://bun.sh/) — do not use npm, yarn, or pnpm.

## 1. Smart contracts

```bash
cd smart-contract
cp .env.example .env
forge build
forge test
```

## 2. Backend

```bash
cd backend
cp .env.example .env
bun install
bun run main.ts
```

The API listens on `http://localhost:8080`.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
bun install
bun run dev
```

The app runs on `http://localhost:3000`.

:::note
A real `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [WalletConnect Cloud](https://cloud.walletconnect.com) is required for WalletConnect. Injected wallets work without it.
:::

## 4. This documentation site

```bash
cd docs
bun install
bun run start
```

## Verification

| Scope | Command |
|---|---|
| Backend types | `cd backend && bun run typecheck` |
| Backend tests | `cd backend && bun test` |
| Frontend types | `cd frontend && bun run typecheck` |
| Frontend build | `cd frontend && bun run build` |
| Contracts | `cd smart-contract && forge test` |
| Docs build | `cd docs && bun run build` |
