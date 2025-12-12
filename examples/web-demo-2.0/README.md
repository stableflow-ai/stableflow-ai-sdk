# StableFlow Bridge Demo 2.0

A modern cross-chain bridge demo built with React + TypeScript + Vite + Zustand.

## Features

- Support for multiple blockchain wallets:
  - **EVM Chains**: Ethereum, Arbitrum, Polygon, BSC, Optimism, Avalanche, Base, Gnosis, Berachain
  - **Solana**: Using @solana/wallet-adapter-react
  - **NEAR**: Using @near-wallet-selector
  - **Aptos**: Using @aptos-labs/wallet-adapter-react
  - **Tron**: Using @tronweb3/tronwallet-adapters

- Cross-chain USDT transfers
- Real-time quote fetching
- Transaction history with local storage persistence
- Modern UI with responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
VITE_STABLEFLOW_API_URL=https://api.stableflow.ai
VITE_STABLEFLOW_JWT_TOKEN=your_jwt_token_here
```

3. Start development server:
```bash
npm run dev
```

## Usage

1. Select a "From" chain and connect your wallet
2. Select a "To" chain (different from "From")
3. Enter recipient address (optional, can connect wallet)
4. Enter amount in USDT
5. Click "Get Quote" to fetch available routes
6. Select a route and click "Submit Transaction"

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

