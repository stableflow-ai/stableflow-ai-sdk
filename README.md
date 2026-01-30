# StableFlow AI SDK - TypeScript

A powerful TypeScript SDK for seamless cross-chain token swaps. Built with type safety in mind, this SDK enables developers to easily integrate cross-chain swapping functionality into their applications with minimal setup.

## Prerequisites

- Node.js >= 16
- npm / yarn / pnpm

## Installation

```bash
# Using npm
npm install stableflow-ai-sdk

# Using yarn
yarn add stableflow-ai-sdk

# Using pnpm
pnpm add stableflow-ai-sdk
```

## Quick Start

```typescript
import { OpenAPI, SFA, tokens, EVMWallet, setRpcUrls } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// Initialize the API client
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = "your-JSON-Web-Token";

// (Optional) Configure custom RPC endpoints
setRpcUrls({
  "eth": ["https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"],
  "arb": ["https://arbitrum-one-rpc.publicnode.com"],
});

// Get wallet instance (example with EVM)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);

// Get token configurations
const fromToken = tokens.find(t => t.chainName === 'Ethereum' && t.symbol === 'USDT');
const toToken = tokens.find(t => t.chainName === 'Arbitrum' && t.symbol === 'USDT');

// Get quotes from all bridge services
const quotes = await SFA.getAllQuote({
  dry: false,
  minInputAmount: "0.1",
  prices: {},
  fromToken: fromToken!,
  toToken: toToken!,
  wallet: wallet,
  recipient: '0x...', // recipient address
  refundTo: '0x...', // refund address
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

// Select the best quote and send transaction
const selectedQuote = quotes.find(q => q.quote && !q.error);
if (selectedQuote && selectedQuote.quote) {
  const txHash = await SFA.send(selectedQuote.serviceType, {
    wallet: wallet,
    quote: selectedQuote.quote,
  });
  
  // Check transaction status
  const status = await SFA.getStatus(selectedQuote.serviceType, {
    hash: txHash,
    depositAddress: selectedQuote.quote.depositAddress,
  });
}
```

## Authentication

The StableFlow AI API requires JWT authentication for all endpoints.

### Getting Your JWT Token

To use the SDK, you need to apply for a JWT token:

1. Visit [https://app.stableflow.ai/apply](https://app.stableflow.ai/apply)
2. Submit an application form for API access
3. Once approved, you will receive your JWT token

### Using Your Token

```typescript
// Set your JWT token
OpenAPI.TOKEN = 'your-JSON-Web-Token-here';
```

## Core API Methods

### `getAllQuote` - Get Quotes from All Bridge Services

Retrieves quotes from all supported bridge services (OneClick, CCTP, USDT0) in parallel. Returns an array of quotes with their corresponding service types, allowing users to compare and select the best route.

```typescript
const quotes = await SFA.getAllQuote({
  singleService?: ServiceType,        // Optional: query specific service only
  dry?: boolean,                       // Set to true for testing without deposit address
  minInputAmount?: string,             // Minimum input amount (default: "1")
  prices: Record<string, string>,      // Token prices
  fromToken: TokenConfig,              // Source token configuration
  toToken: TokenConfig,                 // Destination token configuration
  wallet: WalletConfig,                 // Wallet instance (EVMWallet, SolanaWallet, etc.)
  recipient: string,                    // Recipient address on destination chain
  refundTo: string,                     // Refund address on source chain
  amountWei: string,                    // Amount in smallest units (wei/satoshi/etc.)
  slippageTolerance: number,            // Slippage tolerance percentage (e.g., 0.5 for 0.5%)
  oneclickParams?: {
    // Custom fee rates
    appFees?: { recipient: string; fee: number; }[];
    // default is EXACT_INPUT
    swapType?: "EXACT_INPUT" | "EXACT_OUTPUT";
    // default is true
    isProxy?: boolean;
  };
});
```

**Returns**: `Promise<Array<{ serviceType: ServiceType; quote?: any; error?: string }>>`

**Example**:

```typescript
import { SFA, tokens, EVMWallet, GetAllQuoteParams } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);

const fromToken = tokens.find(t => t.contractAddress === '0x...');
const toToken = tokens.find(t => t.contractAddress === '0x...');

const quotes = await SFA.getAllQuote({
  dry: false,
  prices: {},
  fromToken: fromToken!,
  toToken: toToken!,
  wallet: wallet,
  recipient: '0x1234...',
  refundTo: '0x5678...',
  amountWei: ethers.parseUnits('100', fromToken!.decimals).toString(),
  slippageTolerance: 0.5,
});

// Filter valid quotes
const validQuotes = quotes.filter(q => q.quote && !q.error);
console.log('Available routes:', validQuotes.map(q => q.serviceType));
```

**Response Structure**:

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
      fees: {...}
    }
  },
  {
    serviceType: "cctp",
    quote: {...},
    error: undefined
  },
  {
    serviceType: "usdt0",
    error: "Amount exceeds max"
  }
]
```

### `send` - Execute Transaction

Executes the transaction using the specified bridge service based on the service type. This method handles token approval (if needed) and submits the transaction to the blockchain.

```typescript
const txHash = await SFA.send(
  serviceType: ServiceType,  // "oneclick" | "cctp" | "usdt0"
  {
    wallet: WalletConfig,    // Wallet instance
    quote: any,               // Quote object from getAllQuote response
  }
);
```

**Returns**: `Promise<string>` - Transaction hash or signature

**Example**:

```typescript
// After getting quotes and selecting one
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
  
  // Send the transaction
  const txHash = await SFA.send(selectedQuote.serviceType, {
    wallet: wallet,
    quote: selectedQuote.quote,
  });
  
  console.log('Transaction hash:', txHash);
}
```

**Note**: The `send` method automatically submits the transaction hash to the StableFlow service for tracking. You don't need to call `submitDepositTx` separately.

### `getStatus` - Check Transaction Status

Queries the transaction status from the specified bridge service. Returns the current status and destination chain transaction hash (if available).

```typescript
const status = await SFA.getStatus(
  serviceType: ServiceType,  // "oneclick" | "cctp" | "usdt0"
  {
    depositAddress?: string, // Deposit address from quote (for OneClick)
    hash?: string,           // Transaction hash (for USDT0 and CCTP)
  }
);
```

**Returns**: `Promise<{ status: TransactionStatus; toChainTxHash?: string }>`

**TransactionStatus**:
- `TransactionStatus.Pending` - Transaction is pending
- `TransactionStatus.Success` - Transaction completed successfully
- `TransactionStatus.Failed` - Transaction failed or was refunded

**Example**:

```typescript
import { SFA, Service, TransactionStatus } from 'stableflow-ai-sdk';

// For OneClick service
const status = await SFA.getStatus(Service.OneClick, {
  depositAddress: '0x...',
});

// For USDT0 or CCTP service
const status = await SFA.getStatus(Service.Usdt0, {
  hash: '0x...',
});

console.log('Status:', status.status); // "pending" | "success" | "failed"
if (status.toChainTxHash) {
  console.log('Destination tx hash:', status.toChainTxHash);
}
```

**Polling Example**:

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

// Usage
const finalStatus = await pollTransactionStatus(Service.OneClick, {
  depositAddress: '0x...',
});
```

## Supported Bridge Services

The SDK supports three bridge services for general cross-chain swaps, plus a dedicated Hyperliquid deposit flow:

- **OneClick** (`Service.OneClick`) - Native StableFlow bridge service
- **CCTP** (`Service.CCTP`) - Circle's Cross-Chain Transfer Protocol
- **USDT0** (`Service.Usdt0`) - LayerZero-based USDT bridge
- **Hyperliquid** – Deposit from multiple chains into Hyperliquid (destination: Arbitrum USDC). See [Hyperliquid Service](#hyperliquid-service) below.

Each service has different characteristics:
- Different fee structures
- Different supported token pairs
- Different processing times
- Different minimum/maximum amounts

### USDT0 Service Features

The USDT0 service provides LayerZero-based USDT bridging with the following capabilities:

- **Multi-chain Support**: Supports bridging from EVM chains (Ethereum, Arbitrum, Polygon, Optimism, etc.), Solana, and Tron
- **Multi-hop Routing**: Automatically handles multi-hop transfers when direct routes are not available (e.g., Solana → Arbitrum → Ethereum)
- **Dynamic Time Estimation**: Calculates estimated completion time based on source and destination chain block times and confirmations
- **Accurate Fee Estimation**: Improved fee calculation including LayerZero message fees, gas costs, and legacy mesh transfer fees (0.03% for legacy routes)
- **Legacy and Upgradeable Support**: Seamlessly handles both legacy and upgradeable OFT contracts

Use `getAllQuote` to compare all available routes and select the best one for your use case.

### Hyperliquid Service

The Hyperliquid service enables depositing tokens from multiple source chains into Hyperliquid. The destination is fixed as **USDC on Arbitrum**; the SDK uses the OneClick bridge under the hood to swap/bridge from your chosen source token to Arbitrum USDC, then submits a deposit with permit to the Hyperliquid deposit API.

> **Demo**: A runnable example is in [`examples/hyperliquid-demo/`](examples/hyperliquid-demo/) — Next.js app with quote, transfer, deposit, and status/history. Run with `npm run build && cd examples/hyperliquid-demo && npm install && npm run dev` (see [examples/hyperliquid-demo/README.md](examples/hyperliquid-demo/README.md)).

**Exports:**

- `Hyperliquid` – singleton service instance
- `HyperliquidFromTokens` – list of supported source tokens (all tokens except Arbitrum USDC)
- `HyperliuquidToToken` – destination token config (Arbitrum USDC)
- `HyperliuquidMinAmount` – minimum amount in wei (e.g. 5 USDC)
- Types: `HyperliquidQuoteParams`, `HyperliquidTransferParams`, `HyperliquidDepositParams`, `HyperliquidGetStatusParams`, `HyperliquidDepositResponse`, `HyperliquidDepositStatusResponse`, etc.

**Methods:**

| Method | Description |
|--------|-------------|
| `quote(params)` | Get a quote for depositing to Hyperliquid. Returns `{ quote, error }`. |
| `transfer(params)` | Send tokens from the user's wallet to the bridge (uses OneClick). Returns source chain tx hash. |
| `deposit(params)` | After transfer, submit deposit with EIP-2612 permit. Returns `{ code, data: { depositId } }`. |
| `getStatus(params)` | Query deposit status by `depositId`. Returns `{ code, data: { status, txHash } }`. |

**Flow (typical):**

1. User selects source token from `HyperliquidFromTokens` and amount (≥ `HyperliuquidMinAmount`).
2. Call `Hyperliquid.quote(params)` (optionally with `dry: true` for preview, then `dry: false` to get `depositAddress`).
3. Call `Hyperliquid.transfer({ wallet, quote, evmWallet, evmWalletAddress })` to send tokens; receive `txhash`.
4. Optionally switch the wallet to Arbitrum, then call `Hyperliquid.deposit({ ...transferParams, txhash })` to submit the deposit and get `depositId`.
5. Poll or one-off check with `Hyperliquid.getStatus({ depositId })` for `status` and `txHash`. `status` enum is `type HyperliquidDepositStatus = "PROCESSING" | "SUCCESS" | "REFUNDED" | "FAILED";`

**Example:**

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
```

**Token configs:**

- Use `HyperliquidFromTokens` for the source token list (filter by `chainType === 'evm'` if you only support EVM).
- Destination is always `HyperliuquidToToken` (Arbitrum USDC).
- Enforce minimum amount with `HyperliuquidMinAmount` so users do not send below the bridge minimum.

## Wallet Integration

The SDK supports multiple wallet types:

### EVM Wallets (Ethereum, Arbitrum, Polygon, etc.)

**Using ethers.js with BrowserProvider:**

```typescript
import { EVMWallet } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);
```

**Using wagmi/viem (recommended for React apps):**

```typescript
import { EVMWallet } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';
import { usePublicClient, useWalletClient } from 'wagmi';

// In your React component
const publicClient = usePublicClient();
const { data: walletClient } = useWalletClient();

const provider = new ethers.BrowserProvider(publicClient);
const signer = walletClient 
  ? await new ethers.BrowserProvider(walletClient).getSigner()
  : null;

const wallet = new EVMWallet(provider, signer);
```

### Solana Wallets

**Using @solana/wallet-adapter-react (recommended for React apps):**

```typescript
import { SolanaWallet } from 'stableflow-ai-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

// In your React component
const { publicKey, signTransaction } = useWallet();

const wallet = new SolanaWallet({
  publicKey: publicKey,
  signer: { signTransaction }
});
```

**Using wallet adapter directly:**

```typescript
import { SolanaWallet } from 'stableflow-ai-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const publicKey = new PublicKey('YOUR_SOLANA_ADDRESS');

const wallet = new SolanaWallet({
  publicKey: publicKey,
  signer: {
    signTransaction: async (transaction) => {
      // Sign transaction using your wallet adapter
      // Example with Phantom:
      // const provider = window.solana;
      // return await provider.signTransaction(transaction);
      return signedTransaction;
    }
  }
});
```

**Note**: Solana wallets can be used as the source chain for USDT0 bridging, enabling cross-chain transfers from Solana to EVM chains, Tron, and other supported networks.

### Near Wallets

```typescript
import { NearWallet } from 'stableflow-ai-sdk';
import { setupWalletSelector } from '@near-wallet-selector/core';

// Setup wallet selector (e.g., using @near-wallet-selector)
const selector = await setupWalletSelector({
  network: 'mainnet',
  modules: [
    // Add your wallet modules here
  ]
});

const wallet = new NearWallet(selector);
```

**Note**: NearWallet requires a wallet selector instance from `@near-wallet-selector/core`. The selector handles wallet connection and transaction signing.

### Tron Wallets

```typescript
import { TronWallet } from 'stableflow-ai-sdk';

// Using TronLink or other Tron wallet adapters
const wallet = new TronWallet({
  signAndSendTransaction: async (transaction: any) => {
    // Sign transaction using TronWeb
    const signedTransaction = await window.tronWeb.trx.sign(transaction);
    // Send signed transaction
    return await window.tronWeb.trx.sendRawTransaction(signedTransaction);
  },
  address: window.tronWeb?.defaultAddress?.base58, // User's Tron address
});
```

**With TronLink Wallet:**

```typescript
import { TronWallet } from 'stableflow-ai-sdk';

// Wait for TronLink to be available
if (window.tronWeb && window.tronWeb.ready) {
  const wallet = new TronWallet({
    signAndSendTransaction: async (transaction: any) => {
      const signedTransaction = await window.tronWeb.trx.sign(transaction);
      const result = await window.tronWeb.trx.sendRawTransaction(signedTransaction);
      // Return transaction ID (txid)
      return typeof result === 'string' ? result : result.txid;
    },
    address: window.tronWeb.defaultAddress.base58,
  });
}
```

**Note:** The `signAndSendTransaction` function should:
- Accept a transaction object as parameter
- Sign the transaction using the connected wallet
- Send the signed transaction to the network
- Return the transaction ID (txid) as a string, or an object with a `txid` property

### Aptos Wallets

```typescript
import { AptosWallet } from 'stableflow-ai-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

// Using Aptos wallet adapter
const { account, signAndSubmitTransaction } = useWallet();

const wallet = new AptosWallet({
  account: account,
  signAndSubmitTransaction: signAndSubmitTransaction,
});
```

**Note**: AptosWallet requires an account object and a `signAndSubmitTransaction` function from the Aptos wallet adapter (e.g., `@aptos-labs/wallet-adapter-react`).

## Token Configuration

The SDK provides pre-configured token information:

```typescript
import { tokens, usdtTokens, usdcTokens } from 'stableflow-ai-sdk';

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

// Find tokens by chain
const ethereumTokens = tokens.filter(t => t.chainName === 'Ethereum');
```

Each token configuration includes:
- `chainName` - Name of the blockchain
- `chainType` - Type of chain (evm, solana, near, tron, aptos)
- `symbol` - Token symbol (USDT, USDC, etc.)
- `decimals` - Token decimals
- `contractAddress` - Token contract address
- `assetId` - StableFlow asset identifier
- `services` - Array of supported bridge services
- `rpcUrls` - RPC endpoint URLs

## Complete Example

### Example 1: EVM to EVM Bridge (Ethereum → Arbitrum)

Here's a complete example of a cross-chain swap:

```typescript
import { SFA, OpenAPI, tokens, EVMWallet, Service, TransactionStatus, setRpcUrls } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// 1. Initialize SDK
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = 'your-jwt-token';

// (Optional) Configure custom RPC endpoints
setRpcUrls({
  "eth": ["https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"],
  "arb": ["https://arbitrum-one-rpc.publicnode.com"],
});

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

// 4. Get quotes
const quotes = await SFA.getAllQuote({
  dry: false,
  prices: {},
  fromToken,
  toToken,
  wallet,
  recipient: userAddress, // or another address
  refundTo: userAddress,
  amountWei: ethers.parseUnits('100', fromToken.decimals).toString(),
  slippageTolerance: 0.5,
});

// 5. Select best quote (e.g., first valid one)
const selectedQuote = quotes.find(q => q.quote && !q.error);
if (!selectedQuote || !selectedQuote.quote) {
  throw new Error('No valid quotes available');
}

console.log(`Selected route: ${selectedQuote.serviceType}`);
console.log(`Estimated time: ${selectedQuote.quote.estimateTime}s`);

// 6. Handle approval if needed
if (selectedQuote.quote.needApprove) {
  const allowance = await wallet.allowance({
    contractAddress: selectedQuote.quote.quoteParam.fromToken.contractAddress,
    spender: selectedQuote.quote.approveSpender,
    address: userAddress,
  });
  
  if (allowance < BigInt(selectedQuote.quote.quoteParam.amountWei)) {
    await wallet.approve({
      contractAddress: selectedQuote.quote.quoteParam.fromToken.contractAddress,
      spender: selectedQuote.quote.approveSpender,
      amountWei: selectedQuote.quote.quoteParam.amountWei,
    });
  }
}

// 7. Send transaction
const txHash = await SFA.send(selectedQuote.serviceType, {
  wallet,
  quote: selectedQuote.quote,
});

console.log('Transaction submitted:', txHash);

// 8. Poll for status
const statusParams = selectedQuote.serviceType === Service.OneClick
  ? { depositAddress: selectedQuote.quote.quote?.depositAddress }
  : { hash: txHash };

const checkStatus = async () => {
  const status = await SFA.getStatus(selectedQuote.serviceType, statusParams);
  console.log('Current status:', status.status);
  
  if (status.status === TransactionStatus.Success) {
    console.log('Swap completed! Destination tx:', status.toChainTxHash);
  } else if (status.status === TransactionStatus.Failed) {
    console.log('Swap failed or refunded');
  } else {
    // Still pending, check again later
    setTimeout(checkStatus, 5000);
  }
};

checkStatus();
```

### Example 2: Solana to EVM Bridge (Solana → Ethereum)

Bridge USDT from Solana to Ethereum using USDT0:

```typescript
import { SFA, OpenAPI, tokens, SolanaWallet, Service, TransactionStatus, setRpcUrls } from 'stableflow-ai-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// 1. Initialize SDK
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = 'your-jwt-token';

// (Optional) Configure custom RPC endpoints
setRpcUrls({
  "sol": ["https://api.mainnet-beta.solana.com"],
  "eth": ["https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"],
});

// 2. Setup Solana wallet
// Note: In a real application, get these from your wallet adapter
// Example with @solana/wallet-adapter-react:
// const { publicKey, signTransaction } = useWallet();
// const wallet = new SolanaWallet({
//   publicKey: publicKey,
//   signer: { signTransaction }
// });

const connection = new Connection('https://api.mainnet-beta.solana.com');
const publicKey = new PublicKey('YOUR_SOLANA_ADDRESS');
const wallet = new SolanaWallet({
  publicKey: publicKey,
  signer: {
    signTransaction: async (tx) => {
      // Sign transaction using your Solana wallet adapter
      // Example with Phantom:
      // const provider = window.solana;
      // return await provider.signTransaction(tx);
      throw new Error('Implement wallet signing');
    }
  }
});

// 3. Select tokens
const fromToken = tokens.find(t => 
  t.chainName === 'Solana' && t.symbol === 'USDT'
);
const toToken = tokens.find(t => 
  t.chainName === 'Ethereum' && t.symbol === 'USDT'
);

if (!fromToken || !toToken) {
  throw new Error('Token pair not supported');
}

// 4. Get quotes (USDT0 will automatically use multi-hop routing if needed)
const quotes = await SFA.getAllQuote({
  dry: false,
  prices: {},
  fromToken,
  toToken,
  wallet,
  recipient: '0x...', // Ethereum recipient address
  refundTo: publicKey.toString(), // Solana refund address
  amountWei: '1000000', // 1 USDT (6 decimals)
  slippageTolerance: 0.5,
});

// 5. Find USDT0 quote
const usdt0Quote = quotes.find(q => q.serviceType === Service.Usdt0 && q.quote && !q.error);
if (usdt0Quote && usdt0Quote.quote) {
  console.log(`USDT0 route available`);
  console.log(`Estimated time: ${usdt0Quote.quote.estimateTime}s`);
  console.log(`Total fees: $${usdt0Quote.quote.totalFeesUsd}`);
  
  // 6. Send transaction
  const txHash = await SFA.send(Service.Usdt0, {
    wallet,
    quote: usdt0Quote.quote,
  });
  
  console.log('Transaction submitted:', txHash);
  
  // 7. Poll for status
  const checkStatus = async () => {
    const status = await SFA.getStatus(Service.Usdt0, { hash: txHash });
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
}
```

## Error Handling

The SDK throws typed errors that you can catch and handle:

```typescript
import { ApiError } from 'stableflow-ai-sdk';

try {
  const quotes = await SFA.getAllQuote(params);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        console.error('Authentication failed: JWT is missing or invalid');
        break;
      case 400:
        console.error('Invalid request:', error.body);
        break;
      default:
        console.error('API error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

Common error scenarios:

- **Invalid parameters**: Missing or invalid token configurations, addresses, or amounts
- **Insufficient balance**: User doesn't have enough tokens
- **Amount too low**: Amount below minimum threshold for the bridge service
- **Amount exceeds max**: Amount above maximum limit for the bridge service
- **No route available**: No bridge service supports the token pair
- **Network errors**: Connection issues or RPC failures

## Type Definitions

The SDK provides full TypeScript type definitions:

- `GetAllQuoteParams` - Parameters for `getAllQuote`
- `ServiceType` - Bridge service type (`"oneclick" | "cctp" | "usdt0"`)
- `Service` - Service constants
- `TokenConfig` - Token configuration interface
- `WalletConfig` - Wallet interface
- `TransactionStatus` - Transaction status enum

## Custom RPC Configuration

The SDK allows you to configure custom RPC endpoints for different blockchains. This is useful when you want to use your own RPC providers, private endpoints, or RPC services with API keys.

### Setting Custom RPC URLs

You can set custom RPC URLs using the `setRpcUrls` function. The function accepts a record where keys are blockchain identifiers and values are arrays of RPC URLs.

**Supported Blockchain Identifiers:**
- `"eth"` - Ethereum
- `"arb"` - Arbitrum
- `"bsc"` - BNB Smart Chain
- `"avax"` - Avalanche
- `"base"` - Base
- `"pol"` - Polygon
- `"gnosis"` - Gnosis Chain
- `"op"` - Optimism
- `"bera"` - Berachain
- `"tron"` - Tron
- `"aptos"` - Aptos
- `"sol"` - Solana
- `"near"` - NEAR Protocol
- `"xlayer"` - X Layer

**Basic Usage:**

```typescript
import { setRpcUrls } from 'stableflow-ai-sdk';

// Set custom RPC URLs for specific blockchains
setRpcUrls({
  "eth": ["https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"],
  "arb": ["https://arbitrum-one-rpc.publicnode.com"],
  "sol": ["https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY"],
  "near": ["https://rpc.mainnet.near.org"],
});
```

**Multiple RPC URLs (Fallback Support):**

You can provide multiple RPC URLs for the same blockchain. The SDK will use them in order, with the first URL being the primary endpoint:

```typescript
setRpcUrls({
  "eth": [
    "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
    "https://eth.merkle.io",
    "https://cloudflare-eth.com"
  ],
  "arb": [
    "https://arbitrum-one-rpc.publicnode.com",
    "https://arb1.arbitrum.io/rpc"
  ],
});
```

**How It Works:**

- Custom RPC URLs are prepended to the default RPC URLs for each blockchain
- If a custom URL already exists in the default list, it won't be duplicated
- The SDK will prioritize custom URLs over default ones
- Multiple URLs can be provided for redundancy and fallback support

**Getting Current RPC URLs:**

You can access the current RPC configuration using `NetworkRpcUrlsMap`:

```typescript
import { NetworkRpcUrlsMap, getRpcUrls } from 'stableflow-ai-sdk';

// Get all RPC URLs for a specific blockchain
const ethRpcUrls = getRpcUrls("eth");
console.log(ethRpcUrls); // ["https://custom-rpc.com", "https://eth.merkle.io", ...]

// Access the full RPC URLs map
console.log(NetworkRpcUrlsMap);
```

**Complete Example:**

```typescript
import { OpenAPI, SFA, tokens, EVMWallet, setRpcUrls } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// Initialize the API client
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = "your-JSON-Web-Token";

// Configure custom RPC endpoints
setRpcUrls({
  "eth": ["https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"],
  "arb": ["https://arbitrum-one-rpc.publicnode.com"],
  "sol": ["https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY"],
});

// Get wallet instance (will use custom RPC if configured)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);

// Continue with your swap flow...
const fromToken = tokens.find(t => t.chainName === 'Ethereum' && t.symbol === 'USDT');
const toToken = tokens.find(t => t.chainName === 'Arbitrum' && t.symbol === 'USDT');

const quotes = await SFA.getAllQuote({
  dry: false,
  minInputAmount: "0.1",
  prices: {},
  fromToken: fromToken!,
  toToken: toToken!,
  wallet: wallet,
  recipient: '0x...',
  refundTo: '0x...',
  amountWei: ethers.parseUnits('100', fromToken!.decimals).toString(),
  slippageTolerance: 0.5,
});
```

**Best Practices:**

1. **Set RPC URLs Early**: Configure custom RPC URLs before initializing wallets or making API calls
2. **Use Multiple URLs**: Provide fallback RPC URLs for better reliability
3. **API Key Security**: Never commit API keys to version control. Use environment variables:
   ```typescript
   setRpcUrls({
     "eth": [process.env.ETH_RPC_URL || "https://eth.merkle.io"],
     "sol": [process.env.SOL_RPC_URL || "https://solana-rpc.publicnode.com"],
   });
   ```
4. **Test Your RPCs**: Ensure your custom RPC endpoints are working correctly before deploying

## Examples

### 🌐 Web Application Demo 2.0

**Try our interactive web app with real wallet connection:**

```bash
cd examples/web-demo-2.0
npm install
npm run dev
```

Features:
- 🔗 **Multi-Wallet Support** - Connect MetaMask, Solana, Near, Tron, Aptos wallets
- 🎨 **Modern UI** - Beautiful interface with real-time updates
- 🌐 **Multiple Chains** - Support for all major blockchains
- 💰 **Multi-Token Support** - USDT and USDC bridging
- 💵 **Real-Time Quotes** - Compare quotes from all bridge services
- 🚀 **One-Click Execution** - Execute transactions with automatic approval
- 📊 **Transaction History** - Track your bridging activity with status polling

**Tech Stack**: TypeScript, React, Vite, StableFlow SDK

See [examples/web-demo-2.0/README.md](examples/web-demo-2.0/README.md) for full documentation.

## Migration from v1.0

If you're using SDK v1.0, see the [v1.0 documentation](README-v1.md) for the old API methods (`getQuote`, `getExecutionStatus`, `submitDepositTx`).

Key differences in v2.0:
- `getAllQuote` replaces `getQuote` and returns quotes from all services
- `send` replaces `submitDepositTx` and handles transaction submission automatically
- `getStatus` replaces `getExecutionStatus` with service-specific status checking
- Wallet instances are now required for quote requests
- Token configurations are provided via the `tokens` export

## Development

Developer commands:

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Clean build artifacts
npm run clean

# Watch mode for development
npm run dev
```

## License

MIT

## Support

For issues or support:

- Open an issue on GitHub
- Check the documentation
- Contact our support team

## Changelog

### v2.0.0
- Added `getAllQuote` method to get quotes from all bridge services
- Added `send` method for executing transactions
- Added `getStatus` method for checking transaction status
- Support for multiple bridge services (OneClick, CCTP, USDT0)
- Wallet integration for multiple chains
- Pre-configured token information
- **USDT0 Improvements**:
  - Support for bridging from Solana as source chain
  - Multi-hop routing support for cross-chain transfers
  - Improved fee estimation accuracy
  - Dynamic time estimation based on chain block times
  - Fixed multi-hop composer issues

### v1.0.0
- Initial release
- Support for cross-chain token swaps
- JWT authentication support
- Full TypeScript type definitions
