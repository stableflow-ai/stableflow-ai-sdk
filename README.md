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
import { OpenAPI, SFA, tokens, EVMWallet } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// Initialize the API client
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = "your-JSON-Web-Token";

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

The SDK supports three bridge services:

- **OneClick** (`Service.OneClick`) - Native StableFlow bridge service
- **CCTP** (`Service.CCTP`) - Circle's Cross-Chain Transfer Protocol
- **USDT0** (`Service.Usdt0`) - LayerZero-based USDT bridge

Each service has different characteristics:
- Different fee structures
- Different supported token pairs
- Different processing times
- Different minimum/maximum amounts

Use `getAllQuote` to compare all available routes and select the best one for your use case.

## Wallet Integration

The SDK supports multiple wallet types:

### EVM Wallets (Ethereum, Arbitrum, Polygon, etc.)

```typescript
import { EVMWallet } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);
```

### Solana Wallets

```typescript
import { SolanaWallet } from 'stableflow-ai-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const wallet = new SolanaWallet(connection, publicKey, signTransaction);
```

### Near Wallets

```typescript
import { NearWallet } from 'stableflow-ai-sdk';

const wallet = new NearWallet(connection, accountId, keyPair);
```

### Tron Wallets

```typescript
import { TronWallet } from 'stableflow-ai-sdk';

const wallet = new TronWallet(tronWeb);
```

### Aptos Wallets

```typescript
import { AptosWallet } from 'stableflow-ai-sdk';

const wallet = new AptosWallet(provider, signer);
```

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
- `rpcUrl` - RPC endpoint URL

## Complete Example

Here's a complete example of a cross-chain swap:

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

### v1.0.0
- Initial release
- Support for cross-chain token swaps
- JWT authentication support
- Full TypeScript type definitions
