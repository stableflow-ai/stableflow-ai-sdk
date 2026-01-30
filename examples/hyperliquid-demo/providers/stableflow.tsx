"use client";

import { OpenAPI, setRpcUrls } from "stableflow-ai-sdk";

// Configure SDK
OpenAPI.BASE = process.env.NEXT_PUBLIC_STABLEFLOW_API_URL || 'https://api.stableflow.ai';
const JWT_TOKEN = process.env.NEXT_PUBLIC_STABLEFLOW_JWT_TOKEN;
if (JWT_TOKEN) {
  OpenAPI.TOKEN = JWT_TOKEN;
}

setRpcUrls({
  "arb": ["https://arbitrum-one-rpc.publicnode.com"],
  "eth": ["https://cloudflare-eth.com"],
});

const StableflowProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default StableflowProvider;
