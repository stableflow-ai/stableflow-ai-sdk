# StableFlow AI SDK - Developer Guide

A comprehensive guide for developers to integrate cross-chain token bridging into your applications.

## Table of Contents

- [Getting Started](#getting-started)
- [API Configuration](#api-configuration)
- [Core Functions (v2.0)](#core-functions-v20)
- [Wallet Integration](#wallet-integration)
- [Token Configuration](#token-configuration)
- [Bridge Services](#bridge-services)
  - [Hyperliquid](#hyperliquid)
- [Working Examples](#working-examples)
  - [Hyperliquid Demo](#hyperliquid-demo)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Developer Fees](#developer-fees)
- [Migration from v1.0](#migration-from-v10)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
npm install stableflow-ai-sdk
```

### Prerequisites

- **Node.js**: Version 16 or higher
- **JWT Token**: Required for API access
  
  [![Apply for API Access](https://img.shields.io/badge/Apply_for_API_Access-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://docs.google.com/forms/u/3/d/e/1FAIpQLSdTeV7UaZ1MiFxdJ2jH_PU60PIN3iqYJ1WXEOFY45TsAy6O5g/viewform)
- **TypeScript** (recommended): For full type safety
- **Wallet Libraries**: Depending on your target chains:
  
  - EVM: `ethers` (v6.x)
  - Solana: `@solana/web3.js`, `@solana/spl-token`
  - NEAR: `near-api-js`
  - Tron: `tronweb`
  - Aptos: `@aptos-labs/ts-sdk`

---

## API Configuration

### Basic Setup

```typescript
import { OpenAPI, SFA } from 'stableflow-ai-sdk';

// Configure API endpoint
OpenAPI.BASE = 'https://api.stableflow.ai';

// Set your JWT token
OpenAPI.TOKEN = 'your-jwt-token-here';
```

### Configuration Options

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `OpenAPI.BASE` | string | API endpoint URL | Yes |
| `OpenAPI.TOKEN` | string | JWT authentication token | Yes |
| `OpenAPI.WITH_CREDENTIALS` | boolean | Include credentials in requests | No |
| `OpenAPI.HEADERS` | object | Additional request headers | No |

---

## Core Functions (v2.0)

### 1. `getAllQuote()` ⭐ Recommended

Retrieves quotes from all available bridge services, supporting parallel queries across multiple bridge services (OneClick, CCTP, USDT0), allowing users to compare and select the best route.

#### Signature

```typescript
SFA.getAllQuote(params: GetAllQuoteParams): Promise<Array<{ serviceType: ServiceType; quote?: any; error?: string }>>
```

#### Request Parameters

```typescript
interface GetAllQuoteParams {
  singleService?: ServiceType;        // Optional: query specific service only
  dry?: boolean;                      // true = test mode, no real deposit address
  minInputAmount?: string;            // Minimum input amount (default: "1")
  prices: Record<string, string>;     // Token prices (USD)
  fromToken: TokenConfig;             // Source token configuration
  toToken: TokenConfig;               // Destination token configuration
  wallet: WalletConfig;               // Wallet instance (EVMWallet, SolanaWallet, etc.)
  recipient: string;                  // Recipient address on destination chain
  refundTo: string;                   // Refund address on source chain
  amountWei: string;                  // Amount in smallest units (e.g., wei)
  slippageTolerance: number;         // Slippage tolerance (percentage, e.g., 0.5 for 0.5%)
  oneclickParams?: {
    // Custom fee rates
    appFees?: { recipient: string; fee: number; }[];
    // default is EXACT_INPUT
    swapType?: "EXACT_INPUT" | "EXACT_OUTPUT";
    // default is true
    isProxy?: boolean;
  };
}
```

#### Returns

Returns an array containing quotes from all available bridge services:

```typescript
[
  {
    serviceType: "oneclick",
    quote: {
      quote: QuoteResponse,
      quoteParam: {...},
      sendParam: {...},
      depositAddress: "0x...",
      needApprove: boolean,
      approveSpender: "0x...",
      fees: {...},
      outputAmount: string,
      estimateTime: number
    }
  },
  {
    serviceType: "cctp",
    quote: {...}
  },
  {
    serviceType: "usdt0",
    error: "Amount exceeds max"  // If this service is unavailable
  }
]
```

#### Example Usage

```typescript
import { SFA, tokens, EVMWallet, GetAllQuoteParams } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// 1. Initialize wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);

// 2. Select tokens
const fromToken = tokens.find(t => 
  t.chainName === 'Ethereum' && t.symbol === 'USDT'
);
const toToken = tokens.find(t => 
  t.chainName === 'Arbitrum' && t.symbol === 'USDT'
);

// 3. Get all quotes
const quotes = await SFA.getAllQuote({
  dry: false,
  prices: {},
  fromToken: fromToken!,
  toToken: toToken!,
  wallet: wallet,
  recipient: '0x1234...',
  refundTo: '0x5678...',
  amountWei: ethers.parseUnits('100', fromToken!.decimals).toString(),
  slippageTolerance: 0.5, // 0.5%
  // Optional
  oneclickParams: {
    appFees: [
      {
        // your fee collection address
        recipient: "stableflow.near",
        // Fee rate, as a percentage of the amount. 100 = 1%, 1 = 0.01%
        fee: 100,
      },
    ],
  },
});

// 4. Filter valid quotes
const validQuotes = quotes.filter(q => q.quote && !q.error);
console.log('Available routes:', validQuotes.map(q => q.serviceType));

// 5. Select best quote (e.g., lowest fee)
const bestQuote = validQuotes.reduce((best, current) => {
  const bestFee = parseFloat(best.quote?.totalFeesUsd || '0');
  const currentFee = parseFloat(current.quote?.totalFeesUsd || '0');
  return currentFee < bestFee ? current : best;
});
```

#### Use Cases

- Compare fees and speeds across different bridge services
- Provide users with multiple route options
- Automatically select the optimal route
- Handle service unavailability scenarios

---

### 2. `send()` ⭐ Recommended

Executes cross-chain transactions, automatically handling token approval (if needed) and submitting transactions to the blockchain. This method automatically submits transaction hashes to the StableFlow service for tracking based on the service type.

#### Signature

```typescript
SFA.send(
  serviceType: ServiceType,
  params: {
    wallet: WalletConfig;
    quote: any;
  }
): Promise<string>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `serviceType` | `ServiceType` | Bridge service type: `"oneclick" \| "cctp" \| "usdt0"` |
| `params.wallet` | `WalletConfig` | Wallet instance |
| `params.quote` | `any` | Quote object returned from `getAllQuote` |

#### Returns

`Promise<string>` - Transaction hash or signature

#### Example Usage

```typescript
import { SFA, Service } from 'stableflow-ai-sdk';

// After getting quotes, select the best route
const selectedQuote = quotes.find(q => q.quote && !q.error);

if (selectedQuote && selectedQuote.quote) {
  // Check if approval is needed
  if (selectedQuote.quote.needApprove) {
    await wallet.approve({
      contractAddress: selectedQuote.quote.quoteParam.fromToken.contractAddress,
      spender: selectedQuote.quote.approveSpender,
      amountWei: selectedQuote.quote.quoteParam.amountWei,
    });
  }
  
  // Send transaction
  const txHash = await SFA.send(selectedQuote.serviceType, {
    wallet: wallet,
    quote: selectedQuote.quote,
  });
  
  console.log('Transaction hash:', txHash);
}
```

#### Important Notes

- **Auto-submit**: The `send` method automatically submits transaction hashes to the StableFlow service, no need to manually call `submitDepositTx`
- **Approval handling**: If `needApprove` is `true` in the quote, you need to call the wallet's `approve` method first
- **Error handling**: If the transaction fails, an error will be thrown and should be handled appropriately

---

### 3. `getStatus()` ⭐ Recommended

Queries the current status of cross-chain transactions, supporting status queries for different bridge services.

#### Signature

```typescript
SFA.getStatus(
  serviceType: ServiceType,
  params: {
    depositAddress?: string;
    hash?: string;
  }
): Promise<{ status: TransactionStatus; toChainTxHash?: string }>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `serviceType` | `ServiceType` | Bridge service type |
| `params.depositAddress` | `string?` | Deposit address (used for OneClick service) |
| `params.hash` | `string?` | Transaction hash (used for USDT0 and CCTP services) |

#### Returns

```typescript
{
  status: TransactionStatus;      // "pending" | "success" | "failed"
  toChainTxHash?: string;         // Destination chain transaction hash (when successful)
}
```

#### TransactionStatus

- `TransactionStatus.Pending` - Transaction is processing
- `TransactionStatus.Success` - Transaction completed successfully
- `TransactionStatus.Failed` - Transaction failed or was refunded

#### Example Usage

```typescript
import { SFA, Service, TransactionStatus } from 'stableflow-ai-sdk';

// OneClick service: query using deposit address
const status1 = await SFA.getStatus(Service.OneClick, {
  depositAddress: '0x...',
});

// USDT0 or CCTP service: query using transaction hash
const status2 = await SFA.getStatus(Service.Usdt0, {
  hash: '0x...',
});

console.log('Status:', status1.status);
if (status1.toChainTxHash) {
  console.log('Destination chain tx hash:', status1.toChainTxHash);
}
```

#### Polling Example

```typescript
async function pollTransactionStatus(
  serviceType: ServiceType,
  params: { depositAddress?: string; hash?: string },
  interval: number = 5000
): Promise<{ status: TransactionStatus; toChainTxHash?: string }> {
  return new Promise((resolve) => {
    const checkStatus = async () => {
      try {
        const result = await SFA.getStatus(serviceType, params);
        if (result.status !== TransactionStatus.Pending) {
          resolve(result);
        } else {
          setTimeout(checkStatus, interval);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setTimeout(checkStatus, interval);
      }
    };
    checkStatus();
  });
}

// Usage example
const finalStatus = await pollTransactionStatus(Service.OneClick, {
  depositAddress: '0x...',
});
```

---

## Wallet Integration

The SDK supports multiple wallet types, with corresponding wallet classes for each chain.

### EVM Wallets (Ethereum, Arbitrum, Polygon, BSC, etc.)

```typescript
import { EVMWallet } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// Using browser wallet (e.g., MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send('eth_requestAccounts', []);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);

// Or using custom RPC
const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth');
const wallet = new EVMWallet(provider);
```

### Solana Wallets

```typescript
import { SolanaWallet } from 'stableflow-ai-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const publicKey = new PublicKey('YourPublicKey');
const wallet = new SolanaWallet(connection, publicKey, signTransaction);
```

### NEAR Wallets

```typescript
import { NearWallet } from 'stableflow-ai-sdk';
import { connect, keyStores, WalletConnection } from 'near-api-js';

const nearConnection = await connect({
  networkId: 'mainnet',
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://wallet.mainnet.near.org',
});

const wallet = new NearWallet(nearConnection, accountId, keyPair);
```

### Tron Wallets

```typescript
import { TronWallet } from 'stableflow-ai-sdk';
import TronWeb from 'tronweb';

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
});
const wallet = new TronWallet(tronWeb);
```

### Aptos Wallets

```typescript
import { AptosWallet } from 'stableflow-ai-sdk';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);
const wallet = new AptosWallet(aptos, signer);
```

---

## Token Configuration

The SDK provides pre-configured token information, eliminating the need to manually query the API.

### Import Token Configuration

```typescript
import { tokens, usdtTokens, usdcTokens } from 'stableflow-ai-sdk';
```

### Usage Examples

```typescript
// Get all supported tokens
const allTokens = tokens;

// Get USDT tokens only
const usdtOnly = usdtTokens;

// Get USDC tokens only
const usdcOnly = usdcTokens;

// Find token by contract address
const token = tokens.find(t => 
  t.contractAddress.toLowerCase() === '0x...'.toLowerCase()
);

// Find token by chain name and symbol
const ethUsdt = tokens.find(t => 
  t.chainName === 'Ethereum' && t.symbol === 'USDT'
);

// Filter by chain type
const evmTokens = tokens.filter(t => t.chainType === 'evm');
const solanaTokens = tokens.filter(t => t.chainType === 'sol');
```

### TokenConfig Interface

```typescript
interface TokenConfig {
  chainName: string;          // Chain name (e.g., "Ethereum", "Arbitrum")
  chainType: string;          // Chain type ("evm", "sol", "near", "tron", "aptos")
  symbol: string;             // Token symbol ("USDT", "USDC")
  decimals: number;           // Token decimals (6, 18, etc.)
  contractAddress: string;    // Contract address
  assetId: string;           // StableFlow asset identifier
  services: ServiceType[];   // Array of supported bridge services
  rpcUrl?: string;           // RPC endpoint URL
  nativeToken?: {            // Native token information
    symbol: string;
    decimals: number;
  };
}
```

---

## Bridge Services

The SDK supports three bridge services for general cross-chain swaps, plus a dedicated Hyperliquid deposit flow. Each has different characteristics:

### OneClick (`Service.OneClick`)

- **Features**: Native StableFlow bridge service
- **Advantages**: Supports the widest range of token pairs, best user experience
- **Fees**: Included in quote
- **Speed**: Typically 3-30 minutes
- **Query Method**: Use `depositAddress`

### CCTP (`Service.CCTP`)

- **Features**: Circle's Cross-Chain Transfer Protocol
- **Advantages**: Officially supported, high security
- **Tokens**: Primarily supports USDC
- **Fees**: Includes bridge fees and gas fees
- **Speed**: Typically 3-8 minutes
- **Query Method**: Use transaction `hash`

### USDT0 (`Service.Usdt0`)

- **Features**: LayerZero-based USDT bridge
- **Advantages**: Decentralized, supports multiple chains
- **Tokens**: Primarily supports USDT
- **Fees**: LayerZero fees + gas fees
- **Speed**: Varies by chain, typically 5-30 minutes
- **Query Method**: Use transaction `hash`

### Hyperliquid

Deposit from multiple source chains into **Hyperliquid**. Destination is fixed as **USDC on Arbitrum**; the SDK uses OneClick under the hood to swap/bridge to Arbitrum USDC, then submits a deposit with EIP-2612 permit to the Hyperliquid deposit API.

#### Exports

| Export | Description |
|--------|-------------|
| `Hyperliquid` | Singleton service instance |
| `HyperliquidFromTokens` | Supported source tokens (all except Arbitrum USDC) |
| `HyperliuquidToToken` | Destination token config (Arbitrum USDC) |
| `HyperliuquidMinAmount` | Minimum amount in wei (e.g. 5 USDC) |
| `HyperliquidQuoteParams`, `HyperliquidTransferParams`, etc. | TypeScript interfaces for method params and responses |

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `quote(params)` | Get a quote for depositing to Hyperliquid | `{ quote, error }` |
| `transfer(params)` | Send tokens to the bridge (OneClick). Call after quote with `dry: false`. | Source chain tx hash |
| `deposit(params)` | Submit deposit with permit (after transfer). Switch wallet to Arbitrum if needed. | `{ code, data: { depositId } }` |
| `getStatus(params)` | Query deposit status by `depositId` | `{ code, data: { status, txHash } }` |

#### Typical Flow

1. User selects source token from `HyperliquidFromTokens` and amount (≥ `HyperliuquidMinAmount`).
2. Call `Hyperliquid.quote(params)` — use `dry: true` for preview, then `dry: false` to get `depositAddress`.
3. Call `Hyperliquid.transfer({ wallet, quote, evmWallet, evmWalletAddress })`; receive `txhash`.
4. Optionally switch wallet to Arbitrum, then call `Hyperliquid.deposit({ ...transferParams, txhash })` to get `depositId`.
5. Poll or check with `Hyperliquid.getStatus({ depositId })` for `status` and `txHash`.

#### Example

```typescript
import {
  Hyperliquid,
  HyperliquidFromTokens,
  HyperliuquidToToken,
  HyperliuquidMinAmount,
  OpenAPI,
  EVMWallet
} from 'stableflow-ai-sdk';
import Big from 'big.js';

OpenAPI.TOKEN = 'your-JWT';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);

const account = await signer.getAddress();

// 1. Quote (dry: false to get deposit address for transfer)
const quoteRes = await Hyperliquid.quote({
  dry: false,
  slippageTolerance: 0.05,
  refundTo: account,
  recipient: account,
  wallet,
  fromToken: selectedFromToken,
  prices: {},
  amountWei: Big(amount).times(10 ** HyperliuquidToToken.decimals).toFixed(0, 0),
});
if (quoteRes.error || !quoteRes.quote) throw new Error(quoteRes.error || 'No quote');
const quote = quoteRes.quote;

// 2. Transfer on source chain
const txhash = await Hyperliquid.transfer({
  // wallet is the wallet on the source chain
  wallet,
  // evmWallet is the wallet used for the deposit operation
  // For simplicity in this example, we use the same wallet
  // This means the source chain is also an EVM chain
  evmWallet: wallet,
  evmWalletAddress: account,
  quote,
});

// 3. Submit deposit (after switching to Arbitrum if needed)
const depositRes = await Hyperliquid.deposit({
  wallet,
  evmWallet: wallet,
  evmWalletAddress: account,
  quote,
  txhash,
});
const depositId = depositRes.data?.depositId;

// 4. Check status
const statusRes = await Hyperliquid.getStatus({ depositId: String(depositId) });
// statusRes.data.status, statusRes.data.txHash
// status: type HyperliquidDepositStatus = "PROCESSING" | "SUCCESS" | "REFUNDED" | "FAILED";
```

#### Token Config Notes

- Use `HyperliquidFromTokens` for the source token list (e.g. filter by `chainType === 'evm'` if only supporting EVM).
- Destination is always `HyperliuquidToToken` (Arbitrum USDC).
- Enforce minimum amount with `HyperliuquidMinAmount` so users do not send below the bridge minimum.

### Selection Recommendations

- **USDT Cross-Chain**: Compare OneClick and USDT0, choose the one with lower fees or faster speed
- **USDC Cross-Chain**: Compare OneClick and CCTP
- **Other Tokens**: Usually only OneClick is supported
- **Deposit to Hyperliquid**: Use the `Hyperliquid` service (see [Hyperliquid](#hyperliquid) above); destination is Arbitrum USDC

---

## Working Examples

### Web Demo Application 2.0 ⭐ Recommended

Location: `examples/web-demo-2.0/`

#### Features

- ✅ Multi-wallet support (MetaMask, Solana, NEAR, Aptos, Tron)
- ✅ Multi-chain support (EVM, Solana, NEAR, Tron, Aptos)
- ✅ Multi-token support (USDT, USDC)
- ✅ Real-time quote fetching (all bridge services)
- ✅ Transaction history (local storage)
- ✅ Status polling
- ✅ Modern UI (React + TypeScript + Vite)

#### Running the Example

```bash
cd examples/web-demo-2.0
npm install

# Configure environment variables
cp env.template .env
# Edit .env file and fill in your JWT token

npm run dev
```

#### Key Files

1. **`App.tsx`** - Main application logic
   
   - Get quotes: `handleGetQuote()`
   - Submit transactions: `handleSubmitTransaction()`
   - Uses `SFA.getAllQuote()` and `SFA.send()`
2. **`useWallet.ts`** - Wallet integration hook
   
   - Supports multiple wallet types
   - Automatic network switching
3. **`chains.ts`** - Chain configuration utilities
   
   - Token configurations imported from SDK
   - Chain selector component

#### Learning Path

1. **Start**: Understand the flow in `App.tsx`
2. **Study**: Wallet integration and token configuration
3. **Review**: Error handling patterns
4. **Examine**: UI/UX best practices
5. **Customize**: Adapt for your use case

### Hyperliquid Demo

Location: `examples/hyperliquid-demo/`

#### Features

- Deposit from multiple EVM chains into Hyperliquid (destination: Arbitrum USDC)
- Uses `Hyperliquid.quote()`, `Hyperliquid.transfer()`, `Hyperliquid.deposit()`, `Hyperliquid.getStatus()`
- Token list from `HyperliquidFromTokens`, minimum amount from `HyperliuquidMinAmount`
- Deposit history and status polling (Next.js app)

#### Running the Example

```bash
cd examples/hyperliquid-demo
npm install
cp env.template .env
# Edit .env and set your JWT token
npm run dev
```

#### Key Files

- **`app/page.tsx`** – Quote, approve, transfer, deposit flow; uses `HyperliquidFromTokens` and `HyperliuquidToToken`
- **`app/history/page.tsx`** – Deposit history and `Hyperliquid.getStatus({ depositId })`
- **`stores/history.ts`** – Local history store for deposit IDs and quotes

---

## Best Practices

### 1. Error Handling

Always wrap SDK calls in try-catch blocks:

```typescript
import { ApiError } from 'stableflow-ai-sdk';

try {
  const quotes = await SFA.getAllQuote(params);
  
  // Check if there are valid quotes
  const validQuotes = quotes.filter(q => q.quote && !q.error);
  if (validQuotes.length === 0) {
    const errors = quotes
      .filter(q => q.error)
      .map(q => `${q.serviceType}: ${q.error}`)
      .join(', ');
    throw new Error(`No available quotes: ${errors}`);
  }
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        // Invalid request parameters
        console.error('Request error:', error.body);
        break;
      case 401:
        // Authentication failed
        console.error('JWT token invalid or missing');
        break;
      case 404:
        // Resource not found
        console.error('Endpoint not found');
        break;
      default:
        console.error('API error:', error.message);
    }
  } else {
    // Network or other errors
    console.error('Unexpected error:', error);
  }
}
```

### 2. Token Amount Conversion

Always convert human-readable amounts to smallest units:

```typescript
import { ethers } from 'ethers';

// Human-readable to smallest unit
const decimals = 6;  // USDT decimals
const humanAmount = '100.5';  // 100.5 USDT
const smallestUnit = ethers.parseUnits(humanAmount, decimals);
// Result: 100500000n

// Smallest unit to human-readable
const formatted = ethers.formatUnits(smallestUnit, decimals);
// Result: '100.5'
```

### 3. Quote Comparison

Compare multiple quotes and select the best option:

```typescript
function compareQuotes(quotes: Array<{ serviceType: ServiceType; quote?: any; error?: string }>) {
  const validQuotes = quotes.filter(q => q.quote && !q.error);
  
  if (validQuotes.length === 0) {
    return null;
  }
  
  // Sort by fee
  const sortedByFee = [...validQuotes].sort((a, b) => {
    const feeA = parseFloat(a.quote?.totalFeesUsd || '0');
    const feeB = parseFloat(b.quote?.totalFeesUsd || '0');
    return feeA - feeB;
  });
  
  // Sort by speed
  const sortedBySpeed = [...validQuotes].sort((a, b) => {
    const timeA = a.quote?.estimateTime || Infinity;
    const timeB = b.quote?.estimateTime || Infinity;
    return timeA - timeB;
  });
  
  // Sort by output amount
  const sortedByOutput = [...validQuotes].sort((a, b) => {
    const outputA = parseFloat(a.quote?.outputAmount || '0');
    const outputB = parseFloat(b.quote?.outputAmount || '0');
    return outputB - outputA; // Descending order
  });
  
  return {
    cheapest: sortedByFee[0],
    fastest: sortedBySpeed[0],
    mostOutput: sortedByOutput[0],
    all: validQuotes,
  };
}
```

### 4. Network Validation

Validate network compatibility:

```typescript
import { tokens } from 'stableflow-ai-sdk';

function validateNetworks(fromTokenAddress: string, toTokenAddress: string) {
  if (fromTokenAddress === toTokenAddress) {
    throw new Error('Source and destination chains must be different');
  }
  
  const fromToken = tokens.find(t => 
    t.contractAddress.toLowerCase() === fromTokenAddress.toLowerCase()
  );
  const toToken = tokens.find(t => 
    t.contractAddress.toLowerCase() === toTokenAddress.toLowerCase()
  );
  
  if (!fromToken) {
    throw new Error(`Source chain token not supported: ${fromTokenAddress}`);
  }
  
  if (!toToken) {
    throw new Error(`Destination chain token not supported: ${toTokenAddress}`);
  }
  
  // Check if there are common supported services
  const commonServices = fromToken.services.filter(s => 
    toToken.services.includes(s)
  );
  
  if (commonServices.length === 0) {
    throw new Error('No bridge services available for this token pair');
  }
  
  return { fromToken, toToken, commonServices };
}
```

### 5. Status Polling

Implement exponential backoff for status polling:

```typescript
import { SFA, ServiceType, TransactionStatus } from 'stableflow-ai-sdk';

async function pollStatus(
  serviceType: ServiceType,
  params: { depositAddress?: string; hash?: string }
) {
  let delay = 2000;  // Start with 2 seconds
  const maxDelay = 30000;  // Max 30 seconds
  const maxAttempts = 100;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await SFA.getStatus(serviceType, params);
      
      if (status.status === TransactionStatus.Success) {
        return status;
      }
      
      if (status.status === TransactionStatus.Failed) {
        throw new Error('Transaction failed or was refunded');
      }
      
      // Continue polling
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * 1.5, maxDelay);
    } catch (error) {
      console.error('Error checking status:', error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, maxDelay);
    }
  }
  
  throw new Error('Polling timeout');
}
```

---

## Common Use Cases

### Use Case 1: Simple USDT Cross-Chain Bridge

Bridge USDT from Ethereum to Arbitrum:

```typescript
import { SFA, OpenAPI, tokens, EVMWallet, Service, TransactionStatus } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// 1. Initialize SDK
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = 'your-jwt-token';

// 2. Setup wallet
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send('eth_requestAccounts', []);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);
const userAddress = await signer.getAddress();

// 3. Select tokens
const fromToken = tokens.find(t => 
  t.chainName === 'Ethereum' && t.symbol === 'USDT'
);
const toToken = tokens.find(t => 
  t.chainName === 'Arbitrum' && t.symbol === 'USDT'
);

if (!fromToken || !toToken) {
  throw new Error('Token pair not supported');
}

// 4. Get all quotes
const quotes = await SFA.getAllQuote({
  dry: false,
  prices: {},
  fromToken,
  toToken,
  wallet,
  recipient: userAddress,
  refundTo: userAddress,
  amountWei: ethers.parseUnits('100', fromToken.decimals).toString(),
  slippageTolerance: 0.5,
  // Optional
  oneclickParams: {
    // Fees are optional
    appFees: [
      {
         // ⚠️ Replace with your own fee recipient address
        recipient: "stableflow.near",
        // Fee rate, as a percentage of the amount. 100 = 1%, 1 = 0.01%
        fee: 100,
      },
    ],
  },
});

// 5. Select best quote
const selectedQuote = quotes.find(q => q.quote && !q.error);
if (!selectedQuote || !selectedQuote.quote) {
  throw new Error('No available quotes');
}

// 6. Handle approval if needed
if (selectedQuote.quote.needApprove) {
  await wallet.approve({
    contractAddress: selectedQuote.quote.quoteParam.fromToken.contractAddress,
    spender: selectedQuote.quote.approveSpender,
    amountWei: selectedQuote.quote.quoteParam.amountWei,
  });
}

// 7. Send transaction
const txHash = await SFA.send(selectedQuote.serviceType, {
  wallet,
  quote: selectedQuote.quote,
});

console.log('Transaction submitted:', txHash);

// 8. Poll status
const statusParams = selectedQuote.serviceType === Service.OneClick
  ? { depositAddress: selectedQuote.quote.quote?.depositAddress }
  : { hash: txHash };

const checkStatus = async () => {
  const status = await SFA.getStatus(selectedQuote.serviceType, statusParams);
  console.log('Current status:', status.status);
  
  if (status.status === TransactionStatus.Success) {
    console.log('Bridge completed! Destination tx:', status.toChainTxHash);
  } else if (status.status === TransactionStatus.Failed) {
    console.log('Bridge failed or refunded');
  } else {
    setTimeout(checkStatus, 5000);
  }
};

checkStatus();
```

### Use Case 2: Dynamic Token Selection

Let users choose any supported token pair:

```typescript
import { tokens } from 'stableflow-ai-sdk';

function buildTokenPairSelector() {
  // Group by chain
  const byChain = tokens.reduce((acc, token) => {
    if (!acc[token.chainName]) {
      acc[token.chainName] = [];
    }
    acc[token.chainName].push(token);
    return acc;
  }, {} as Record<string, typeof tokens>);
  
  // Group by token symbol
  const bySymbol = tokens.reduce((acc, token) => {
    if (!acc[token.symbol]) {
      acc[token.symbol] = [];
    }
    acc[token.symbol].push(token);
    return acc;
  }, {} as Record<string, typeof tokens>);
  
  return {
    chains: Object.keys(byChain),
    symbols: Object.keys(bySymbol),
    getTokensForChain: (chainName: string) => byChain[chainName] || [],
    getTokensForSymbol: (symbol: string) => bySymbol[symbol] || [],
    findToken: (chainName: string, symbol: string) =>
      tokens.find(t => t.chainName === chainName && t.symbol === symbol),
  };
}
```

### Use Case 3: Fee Calculator

Calculate bridge fees before execution:

```typescript
import { SFA, tokens, EVMWallet } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

async function calculateFees(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  wallet: EVMWallet
) {
  const fromToken = tokens.find(t => 
    t.contractAddress.toLowerCase() === fromTokenAddress.toLowerCase()
  );
  const toToken = tokens.find(t => 
    t.contractAddress.toLowerCase() === toTokenAddress.toLowerCase()
  );
  
  if (!fromToken || !toToken) {
    throw new Error('Token pair not supported');
  }
  
  // Use dry mode to get quotes (no real deposit address generated)
  const quotes = await SFA.getAllQuote({
    dry: true,
    prices: {},
    fromToken,
    toToken,
    wallet,
    recipient: '0x0000000000000000000000000000000000000000', // Placeholder
    refundTo: '0x0000000000000000000000000000000000000000', // Placeholder
    amountWei: ethers.parseUnits(amount, fromToken.decimals).toString(),
    slippageTolerance: 0.5,
  });
  
  // Calculate fees for each service
  const feeInfo = quotes
    .filter(q => q.quote && !q.error)
    .map(q => ({
      serviceType: q.serviceType,
      totalFeesUsd: parseFloat(q.quote?.totalFeesUsd || '0'),
      outputAmount: q.quote?.outputAmount || '0',
      estimateTime: q.quote?.estimateTime || 0,
    }));
  
  return feeInfo;
}
```

### Use Case 4: Automatic Best Route Selection

Automatically compare all available routes and select the best option:

```typescript
function selectBestQuote(quotes: Array<{ serviceType: ServiceType; quote?: any; error?: string }>) {
  const validQuotes = quotes.filter(q => q.quote && !q.error);
  
  if (validQuotes.length === 0) {
    return null;
  }
  
  // Strategy 1: Select cheapest
  const cheapest = validQuotes.reduce((best, current) => {
    const bestFee = parseFloat(best.quote?.totalFeesUsd || '0');
    const currentFee = parseFloat(current.quote?.totalFeesUsd || '0');
    return currentFee < bestFee ? current : best;
  });
  
  // Strategy 2: Select fastest
  const fastest = validQuotes.reduce((best, current) => {
    const bestTime = best.quote?.estimateTime || Infinity;
    const currentTime = current.quote?.estimateTime || Infinity;
    return currentTime < bestTime ? current : best;
  });
  
  // Strategy 3: Select most output
  const mostOutput = validQuotes.reduce((best, current) => {
    const bestOutput = parseFloat(best.quote?.outputAmount || '0');
    const currentOutput = parseFloat(current.quote?.outputAmount || '0');
    return currentOutput > bestOutput ? current : best;
  });
  
  return {
    cheapest,
    fastest,
    mostOutput,
    // Comprehensive scoring (weights can be adjusted based on requirements)
    bestOverall: cheapest, // Default: select cheapest
  };
}
```

---

## Developer Fees

StableFlow allows any integrator (wallets, DApps, exchanges, OTC desks, etc.) to **monetize every cross-chain transaction** by attaching their own service fee directly to the routing layer.

This is done via the `appFees` parameter, which lets you define who gets paid and how much — enforced automatically on-chain.

---

### How it works

When you request a quote via `getAllQuote()`, you can include an `appFees` array into `oneclickParams`:

```ts
oneclickParams: {
  appFees: [
    {
      recipient: "yourapp.near",
      fee: 100, // 1%
    }
  ]
}
```

This means:

> **1% of the user’s transfer amount will be routed directly to your wallet when the transaction executes.**

No custody.
No settlement process.
No off-chain accounting.

StableFlow embeds your fee into the execution path.

---

### Fee units

| Value | Fee |
|------|------|
| 100  | 1.00% |
| 50   | 0.50% |
| 10   | 0.10% |
| 1    | 0.01% |

---

### Multi-party revenue sharing

```ts
appFees: [
  { recipient: "yourapp.near", fee: 70 },
  { recipient: "kol.near", fee: 30 }
]
```

StableFlow will split fees automatically and send them directly on-chain.

---

## Migration from v1.0

If you're using SDK v1.0, here are the key changes for migrating to v2.0:

### API Changes

| v1.0 | v2.0 | Description |
|------|------|-------------|
| `SFA.getTokens()` | `import { tokens }` | Use pre-configured token list |
| `SFA.getQuote()` | `SFA.getAllQuote()` | Get quotes from all bridge services |
| `SFA.submitDepositTx()` | `SFA.send()` | Automatically handles transaction submission |
| `SFA.getExecutionStatus()` | `SFA.getStatus()` | Supports status queries for different service types |

### Migration Steps

1. **Update imports**:

```typescript
// v1.0
const tokens = await SFA.getTokens();

// v2.0
import { tokens } from 'stableflow-ai-sdk';
```

2. **Update quote fetching**:

```typescript
// v1.0
const quote = await SFA.getQuote(quoteRequest);

// v2.0
const quotes = await SFA.getAllQuote({
  fromToken,
  toToken,
  wallet,
  // ... other parameters
});
const selectedQuote = quotes.find(q => q.quote && !q.error);
```

3. **Update transaction sending**:

```typescript
// v1.0
await usdtContract.transfer(depositAddress, amount);
await SFA.submitDepositTx({ txHash, depositAddress });

// v2.0
const txHash = await SFA.send(serviceType, {
  wallet,
  quote: selectedQuote.quote,
});
```

4. **Update status querying**:

```typescript
// v1.0
const status = await SFA.getExecutionStatus(depositAddress);

// v2.0
const status = await SFA.getStatus(serviceType, {
  depositAddress, // or hash, depending on service type
});
```

### Backward Compatibility

v1.0 API methods are still available but marked as `@deprecated`. It's recommended to migrate to v2.0 API as soon as possible for better functionality and performance.

---

## Troubleshooting

### Common Issues

#### 1. "Invalid parameters" Error

**Cause**: Missing required parameters or incorrect parameter format

**Solution**: Ensure all required parameters are provided:

```typescript
const quotes = await SFA.getAllQuote({
  fromToken,      // ✅ Required
  toToken,        // ✅ Required
  wallet,         // ✅ Required
  recipient,      // ✅ Required
  refundTo,       // ✅ Required
  amountWei,      // ✅ Required
  prices: {},     // ✅ Required
  slippageTolerance: 0.5, // ✅ Required
});
```

#### 2. "Token pair not supported" Error

**Cause**: Selected token pair has no available bridge services

**Solution**: Check the `services` field in token configuration:

```typescript
const fromToken = tokens.find(t => t.contractAddress === '0x...');
const toToken = tokens.find(t => t.contractAddress === '0x...');

// Check if there are common supported services
const commonServices = fromToken.services.filter(s => 
  toToken.services.includes(s)
);

if (commonServices.length === 0) {
  console.error('No bridge services available for this token pair');
}
```

#### 3. "Amount is too low" Error

**Cause**: Amount is below the minimum requirement for the bridge service

**Solution**: Increase the amount or check minimum amount requirements:

```typescript
// Set minimum input amount
const quotes = await SFA.getAllQuote({
  // ...
  minInputAmount: "10", // Minimum 10 token units
  amountWei: ethers.parseUnits('100', decimals).toString(),
});
```

#### 4. "Amount exceeds max" Error

**Cause**: Amount exceeds the maximum limit for the bridge service

**Solution**: Reduce the amount or try other bridge services:

```typescript
// Get all quotes, some services may support larger amounts
const quotes = await SFA.getAllQuote({...});
const validQuotes = quotes.filter(q => !q.error);
```

#### 5. Authentication Error

**Cause**: JWT token is missing or invalid

**Solution**:

**👉 [Apply for JWT Token](https://docs.google.com/forms/u/3/d/e/1FAIpQLSdTeV7UaZ1MiFxdJ2jH_PU60PIN3iqYJ1WXEOFY45TsAy6O5g/viewform)**

After receiving the token, set it before API calls:

```typescript
OpenAPI.TOKEN = 'your-valid-token';
```

#### 6. Network Mismatch

**Cause**: Wallet is connected to a different chain than the token chain

**Solution**: Check and switch network:

```typescript
// EVM chain example
const currentChainId = await window.ethereum.request({ 
  method: 'eth_chainId' 
});

// Switch network based on fromToken
if (fromToken.chainName === 'Ethereum' && currentChainId !== '0x1') {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x1' }],
  });
}
```

#### 7. Approval Failed

**Cause**: Insufficient token allowance or approval transaction failed

**Solution**: Check allowance status and re-approve:

```typescript
if (quote.needApprove) {
  const allowance = await wallet.allowance({
    contractAddress: fromToken.contractAddress,
    spender: quote.approveSpender,
    address: userAddress,
    amountWei: quote.quoteParam.amountWei,
  });
  
  if (allowance.needApprove) {
    await wallet.approve({
      contractAddress: fromToken.contractAddress,
      spender: quote.approveSpender,
      amountWei: quote.quoteParam.amountWei,
    });
  }
}
```

#### 8. Status Query Returns Pending

**Cause**: Transaction is still processing, need to continue polling

**Solution**: Implement polling mechanism:

```typescript
async function pollUntilComplete(serviceType, params) {
  const maxAttempts = 120; // Maximum 10 minutes (5 second intervals)
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await SFA.getStatus(serviceType, params);
    
    if (status.status === TransactionStatus.Success) {
      return status;
    }
    
    if (status.status === TransactionStatus.Failed) {
      throw new Error('Transaction failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  throw new Error('Query timeout');
}
```

---

## Additional Resources

### SDK Repository

- GitHub: [stableflow-ai/stableflow-ai-sdk](https://github.com/stableflow-ai/stableflow-ai-sdk)
- Examples: `examples/` directory
- Issues: Report bugs via GitHub Issues

### StableFlow Platform

- Website: https://app.stableflow.ai/
- API Access: Apply for JWT token
- Documentation: Latest API specs

### Community

- Discord: [Join our community](https://discord.gg/b7Gvw6zCeD)
- Twitter: [@0xStableFlow](https://twitter.com/0xStableFlow)

---

## Summary

### Quick Reference (v2.0)

| Function | Purpose | Required Fields |
|----------|---------|----------------|
| `getAllQuote()` | Get quotes from all bridge services | JWT Token, TokenConfig, WalletConfig, amount, etc. |
| `send()` | Execute cross-chain transaction | ServiceType, WalletConfig, Quote |
| `getStatus()` | Query transaction status | ServiceType, depositAddress or hash |
| `tokens` | Pre-configured token list | No parameters, direct import |

### Deprecated APIs (v1.0)

The following APIs are still available but marked as deprecated. It's recommended to migrate to v2.0:

| Function | Alternative |
|----------|-------------|
| `getTokens()` | `import { tokens }` |
| `getQuote()` | `getAllQuote()` |
| `submitDepositTx()` | `send()` (automatically handled) |
| `getExecutionStatus()` | `getStatus()` |

### Integration Checklist

- [ ] Install SDK via npm
- [ ] Obtain JWT token from StableFlow
- [ ] Configure `OpenAPI.BASE` and `OpenAPI.TOKEN`
- [ ] Select and initialize wallet (EVMWallet, SolanaWallet, etc.)
- [ ] Import token configuration from `tokens`
- [ ] Study web-demo-2.0 example
- [ ] Implement error handling
- [ ] Test with `dry: true` mode first
- [ ] Handle network switching
- [ ] Implement status polling
- [ ] Add user notifications
- [ ] Test with real transactions

### Complete Example Code

Check the `examples/web-demo-2.0/` directory for a complete React application example, including:

- Multi-wallet integration
- Multi-chain support
- Real-time quote comparison
- Transaction history
- Status polling

---

**Happy Building! 🚀**

For questions or support, visit:

- [GitHub Repository](https://github.com/stableflow-ai/stableflow-ai-sdk)
- [Discord Community](https://discord.gg/b7Gvw6zCeD)
- [Apply for API Access](https://docs.google.com/forms/u/3/d/e/1FAIpQLSdTeV7UaZ1MiFxdJ2jH_PU60PIN3iqYJ1WXEOFY45TsAy6O5g/viewform)
