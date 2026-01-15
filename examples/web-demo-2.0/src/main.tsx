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
  "eth": ["https://cloudflare-eth.com"],
  // Of course, this is a fake api-key
  "sol": ["https://mainnet.helius-rpc.com/?api-key=43b83e2b-fa05-4d51-ba81-961234556345"],
});

console.log(NetworkRpcUrlsMap);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletsProvider>
      <App />
    </WalletsProvider>
  </React.StrictMode>
);

