# Hyperliquid Demo

A runnable example that uses the [StableFlow AI SDK](https://github.com/stableflow/stableflow-ai-sdk) **Hyperliquid** service to deposit tokens from EVM chains into Hyperliquid. The destination is **USDC on Arbitrum**; the app uses `Hyperliquid.quote`, `Hyperliquid.transfer`, `Hyperliquid.deposit`, and `Hyperliquid.getStatus`.

## Prerequisites

- Node.js >= 16
- npm / yarn / pnpm
- [JWT token](https://app.stableflow.ai/apply) for the StableFlow API

## Setup

> **Running from the SDK repo**: This example depends on the SDK via `file:../..`. From the **repository root**, run `npm run build` (or `pnpm build`) to build the SDK before installing and running the demo.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp env.template .env.local
   ```

   Edit `.env.local` and set:

   - `NEXT_PUBLIC_STABLEFLOW_API_URL` — default `https://api.stableflow.ai`
   - `NEXT_PUBLIC_STABLEFLOW_JWT_TOKEN` — your JWT token (required)
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — optional, for WalletConnect EVM wallets

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## What This Demo Does

- **Quote**: Select a source token from `HyperliquidFromTokens` (EVM only in this demo), enter amount (≥ `HyperliuquidMinAmount`), and get a quote via `Hyperliquid.quote()`.
- **Approve**: If needed, approve the token for the bridge spender.
- **Transfer**: Send tokens to the bridge on the source chain with `Hyperliquid.transfer()`.
- **Deposit**: After switching to Arbitrum, submit the deposit with permit via `Hyperliquid.deposit()` and receive a `depositId`.
- **History & status**: View deposit history and poll `Hyperliquid.getStatus({ depositId })` for status and destination `txHash`.

## Key Files

| File | Description |
|------|-------------|
| `app/page.tsx` | Main flow: token selection, quote, approve, transfer, deposit; uses `HyperliquidFromTokens`, `HyperliuquidToToken`, `HyperliuquidMinAmount` |
| `app/history/page.tsx` | Deposit history list and “Get status” using `Hyperliquid.getStatus({ depositId })` |
| `stores/history.ts` | Local store for deposit IDs and quote snapshots |
| `providers/stableflow.tsx` | Sets `OpenAPI.BASE` and `OpenAPI.TOKEN` from env |
| `providers/evm-wallet.tsx` | EVM wallet connection and chain switching |

## SDK Documentation

- **Hyperliquid service**: [README – Hyperliquid Service](../../README.md#hyperliquid-service)
- **Developer guide**: [DEVELOPER_GUIDE – Hyperliquid & Hyperliquid Demo](../../DEVELOPER_GUIDE.md#hyperliquid)

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [StableFlow AI SDK](https://www.npmjs.com/package/stableflow-ai-sdk)
- EVM wallet (e.g. MetaMask / WalletConnect)
