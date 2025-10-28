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
import { OpenAPI, QuoteRequest, SFA } from 'stableflow-ai-sdk';

// Initialize the API client
OpenAPI.BASE = 'https://api.stableflow.ai';

// Configure your JSON Web Token (JWT) - required for most endpoints
OpenAPI.TOKEN = "your-JSON-Web-Token";

// Create a quote request
const quoteRequest: QuoteRequest = {
    dry: true, // set to true for testing / false to get `depositAddress` and execute swap
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 100, // 1%
    originAsset: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near', // USDC on Arbitrum
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    destinationAsset: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near', // USDC on Solana
    amount: '1000000', // 1 USDC (in smallest units)
    refundTo: '0x2527D02599Ba641c19FEa793cD0F167589a0f10D', // Valid Arbitrum address
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN, 
    recipient: '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK', // Valid Solana Address
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    deadline: "2025-08-06T14:15:22Z"
};

// Get quote
const quote = await SFA.getQuote(quoteRequest);
```

## API Methods

### Get Quote

```typescript
const quote = await SFA.getQuote(quoteRequest);
```

### Get Execution Status

```typescript
const status = await SFA.getExecutionStatus(depositAddress);
```

### Submit Deposit Transaction

```typescript
const result = await SFA.submitDepositTx({
    txHash: '0x...',
    depositAddress: '0x...'
});
```

### Get Supported Tokens

```typescript
const tokens = await SFA.getTokens();
```

## Authentication

The StableFlow AI API requires JWT authentication for most endpoints.

### Static Token (Required)

```typescript
// Set a static JWT - required for authenticated endpoints
OpenAPI.TOKEN = 'your-JSON-Web-Token';
```

### Dynamic Token Provider (for token refresh)

```typescript
// Set a function that returns a fresh token when needed
OpenAPI.TOKEN = async () => {
  // Get a fresh token from your authentication system
  return 'FRESH_JWT';
};
```

### Protected Endpoints

The following endpoints require JWT authentication:
- `SFA.getQuote()`
- `SFA.submitDepositTx()`
- `SFA.getExecutionStatus()`

## Error Handling

The SDK throws typed errors that you can catch and handle:

```typescript
try {
    const quote = await SFA.getQuote(quoteRequest);
} catch (error) {
    if (error instanceof ApiError && error.status === 401) {
        // Handle authentication errors
        console.error('Authentication failed: JWT is missing or invalid');
    } else if (error instanceof ApiError && error.status === 400) {
        // Handle bad request
        console.error('Invalid request:', error.body);
    } else {
        // Handle other errors
        console.error('Error:', error);
    }
}
```

## Type Definitions

The SDK provides full TypeScript type definitions, including:

- `QuoteRequest` - Parameters for requesting a quote
- `QuoteResponse` - Quote response data
- `GetExecutionStatusResponse` - Execution status response
- `SubmitDepositTxRequest` - Submit deposit transaction request
- `SubmitDepositTxResponse` - Submit deposit transaction response
- `TokenResponse` - Token information

## Examples

### 🌐 Web Application Demo (NEW!)

**Try our interactive web app with real wallet connection:**

```bash
cd examples/web-demo
npm install
npm run dev
```

Features:
- 🔗 **Wallet Connection** - Connect MetaMask or compatible wallets
- 🎨 **Modern UI** - Beautiful dark theme with gradients
- 💱 **21+ Networks** - Ethereum, Arbitrum, Solana, Base, and more
- 💎 **110+ Tokens** - USDT, USDC, ETH, and many others
- 💰 **Real-Time Quotes** - Get accurate fee and time estimates
- 🚀 **Execute Transactions** - Bridge tokens across chains
- 📊 **Transaction History** - Track your bridging activity

**Tech Stack**: TypeScript, Vite, ethers.js, StableFlow SDK

See [examples/web-demo/README.md](examples/web-demo/README.md) for full documentation.

### 💻 Command Line Demo

Interactive CLI tool for testing SDK functionality:

```bash
cd examples
npm install
export STABLEFLOW_JWT_TOKEN='your-jwt-token'
npm run demo
```

See [examples/BRIDGE_DEMO_GUIDE.md](examples/BRIDGE_DEMO_GUIDE.md) for detailed instructions.

### Other Examples

Check the `examples` directory for more examples:

```bash
cd examples
npm install
npm start
```

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

### v1.0.0
- Initial release
- Support for cross-chain token swaps
- JWT authentication support
- Full TypeScript type definitions

