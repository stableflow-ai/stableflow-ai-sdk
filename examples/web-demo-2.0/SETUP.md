# Setup Instructions

## 1. Install Dependencies

```bash
cd examples/web-demo-2.0
npm install
```

## 2. Configure Environment Variables

Copy `env.template` to `.env` and fill in your values:

```bash
cp env.template .env
```

Edit `.env`:
```env
VITE_STABLEFLOW_API_URL=https://api.stableflow.ai
VITE_STABLEFLOW_JWT_TOKEN=your_jwt_token_here
VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

## 3. Run Development Server

```bash
npm run dev
```

## Project Structure

```
web-demo-2.0/
├── src/
│   ├── components/          # React components
│   │   ├── ChainSelector.tsx
│   │   ├── QuoteResult.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── WalletConnector.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useWallet.ts
│   ├── providers/           # Context providers
│   │   └── WalletProviders.tsx
│   ├── stores/              # Zustand stores
│   │   └── transactionStore.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── chains.ts
│   │   └── walletFactory.ts
│   ├── App.tsx              # Main app component
│   ├── App.css              # Styles
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Features

✅ Multi-chain wallet support (EVM, Solana, NEAR, Aptos, Tron)
✅ Cross-chain USDT transfers
✅ Quote fetching from all available bridges
✅ Transaction history with local storage
✅ Modern UI with React + TypeScript

## Notes

- NEAR and Tron wallet connections are partially implemented and may need additional setup
- Make sure to have the required wallet extensions installed in your browser
- The project uses peer dependencies from the SDK, so ensure all peer dependencies are installed

