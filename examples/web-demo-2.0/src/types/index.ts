import type { ServiceType, TokenConfig } from 'stableflow-ai-sdk';

export interface QuoteResult {
  serviceType: ServiceType;
  quote?: any;
  error?: string;
}

export interface Transaction {
  id: string;
  fromToken: TokenConfig;
  toToken: TokenConfig;
  fromChain: string;
  toChain: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  txHash?: string;
  toChainTxHash?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  timestamp: number;
  serviceType?: ServiceType;
  depositAddress?: string;
}

export interface WalletState {
  address: string | null;
  chainType: string | null;
  isConnected: boolean;
}

