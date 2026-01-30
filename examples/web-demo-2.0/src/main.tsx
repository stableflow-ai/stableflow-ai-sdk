import React from 'react';
import ReactDOM from 'react-dom/client';
import WalletsProvider from './providers';
import App from './App';
import { OpenAPI, setRpcUrls, NetworkRpcUrlsMap } from 'stableflow-ai-sdk';

// Configure SDK
OpenAPI.BASE = import.meta.env.VITE_STABLEFLOW_API_URL || 'https://api.stableflow.ai';
const JWT_TOKEN = import.meta.env.VITE_STABLEFLOW_JWT_TOKEN;
if (JWT_TOKEN) {
  OpenAPI.TOKEN = JWT_TOKEN;
}

setRpcUrls({
  "arb": ["https://arbitrum-one-rpc.publicnode.com"],
  "eth": ["https://ethereum-rpc.publicnode.com"],
  "bsc": ["https://bsc-rpc.publicnode.com"],
  "avax": ["https://avalanche-c-chain-rpc.publicnode.com"],
  "base": ["https://base-rpc.publicnode.com"],
  "pol": ["https://polygon-bor-rpc.publicnode.com"],
  "gnosis": ["https://gnosis-rpc.publicnode.com"],
  "op": ["https://optimism-rpc.publicnode.com"],
  "bera": ["https://berachain-rpc.publicnode.com"],
  "tron": ["https://tron-rpc.publicnode.com"],
  "sol": ["https://solana-rpc.publicnode.com"],
});

console.log(NetworkRpcUrlsMap);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletsProvider>
      <App />
    </WalletsProvider>
  </React.StrictMode>
);

