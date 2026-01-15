# StableFlow AI SDK - Developer Guide

A comprehensive guide for developers to integrate cross-chain token bridging into your applications.

## Table of Contents

- [Getting Started](#getting-started)
- [API Configuration](#api-configuration)
- [Core Functions](#core-functions)
- [Working Examples](#working-examples)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
npm install stableflow-ai-sdk
```

### Prerequisites

1. **Node.js**: Version 16 or higher
2. **JWT Token**: Required for API access
   
   [![Apply for API Access](https://img.shields.io/badge/Apply_for_API_Access-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://docs.google.com/forms/u/3/d/e/1FAIpQLSdTeV7UaZ1MiFxdJ2jH_PU60PIN3iqYJ1WXEOFY45TsAy6O5g/viewform)
   
3. **TypeScript** (recommended): For full type safety

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

## Core Functions

### 1. `getTokens()`

Retrieves the list of all supported tokens across different blockchains.

#### Signature

```typescript
SFA.getTokens(): Promise<TokenResponse[]>
```

#### Returns

Array of `TokenResponse` objects containing:

```typescript
interface TokenResponse {
  assetId: string;        // Unique asset identifier
  blockchain: string;     // Network ID (e.g., 'eth', 'arb', 'pol')
  symbol: string;         // Token symbol (e.g., 'USDT', 'USDC')
  decimals: number;       // Token decimals (e.g., 6, 18)
  address?: string;       // Contract address
  price?: string;         // Current price in USD
}
```

#### Example Usage

```typescript
// Fetch all supported tokens
const tokens = await SFA.getTokens();

// Filter USDT tokens
const usdtTokens = tokens.filter(t => t.symbol === 'USDT');

// Get tokens for specific network
const ethTokens = tokens.filter(t => t.blockchain === 'eth');

// Find specific token
const arbUsdc = tokens.find(
  t => t.blockchain === 'arb' && t.symbol === 'USDC'
);
```

#### Use Cases

- Building token selection UI
- Validating supported tokens
- Getting current token prices
- Discovering available networks

---

### 2. `getQuote()`

Requests a quote for cross-chain token swap, including fees, estimated time, and deposit address.

#### Signature

```typescript
SFA.getQuote(request: QuoteRequest): Promise<QuoteResponse>
```

#### Request Parameters

```typescript
interface QuoteRequest {
  // Testing mode (true = no real deposit address)
  dry: boolean;
  
  // Swap calculation type
  swapType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  
  // Slippage tolerance in basis points (100 = 1%)
  slippageTolerance: number;
  
  // Source token asset ID
  originAsset: string;
  
  // Where user deposits funds
  depositType: 'ORIGIN_CHAIN' | 'NEAR';
  
  // Destination token asset ID
  destinationAsset: string;
  
  // Amount in token's smallest unit
  amount: string;
  
  // Refund address if swap fails
  refundTo: string;
  
  // Refund location
  refundType: 'ORIGIN_CHAIN' | 'NEAR';
  
  // Recipient address for destination tokens
  recipient: string;
  
  // Recipient location
  recipientType: 'DESTINATION_CHAIN' | 'NEAR';
  
  // Quote expiration time (ISO 8601)
  deadline: string;
  
  // Optional: max wait time for quote in milliseconds
  quoteWaitingTimeMs?: number;
}
```

#### Response

```typescript
interface QuoteResponse {
  quote: {
    depositAddress: string;      // Address to send tokens to
    amountIn: string;             // Input amount (smallest unit)
    amountInFormatted: string;    // Input amount (human-readable)
    amountOut: string;            // Output amount (smallest unit)
    amountOutFormatted: string;   // Output amount (human-readable)
    minAmountOut: string;         // Minimum output after slippage
    amountInUsd: string;          // Input value in USD
    amountOutUsd: string;         // Output value in USD
    timeEstimate: number;         // Estimated completion time (seconds)
    appFee?: AppFee;              // Fee breakdown
  };
  swapDetails: SwapDetails;       // Detailed swap information
  transactionDetails: TransactionDetails;  // Transaction parameters
}
```

#### Example Usage

```typescript
import { QuoteRequest } from 'stableflow-ai-sdk';

const quoteRequest: QuoteRequest = {
  dry: false,  // Get real deposit address
  swapType: QuoteRequest.swapType.EXACT_INPUT,
  slippageTolerance: 100,  // 1%
  
  // Swap from Arbitrum USDT to Ethereum USDT
  originAsset: 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near',
  destinationAsset: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
  
  amount: '1000000',  // 1 USDT (6 decimals)
  
  depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
  refundTo: '0xYourArbitrumAddress',
  refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
  
  recipient: '0xYourEthereumAddress',
  recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
  
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const quote = await SFA.getQuote(quoteRequest);

console.log('Deposit to:', quote.quote.depositAddress);
console.log('You will receive:', quote.quote.amountOutFormatted);
console.log('Estimated time:', quote.quote.timeEstimate, 'seconds');
```

#### Important Notes

- **`dry: true`**: Testing mode, no real deposit address
- **`dry: false`**: Production mode, returns real deposit address
- **Amount Format**: Always use smallest token unit (e.g., 1 USDT = 1000000 for 6 decimals)
- **Deadline**: Must be a future timestamp in ISO 8601 format
- **Address Validation**: Ensure addresses match the respective network format

---

### 3. `submitDepositTx()`

Notifies StableFlow that you've sent tokens to the deposit address.

#### Signature

```typescript
SFA.submitDepositTx(request: SubmitDepositTxRequest): Promise<SubmitDepositTxResponse>
```

#### Request Parameters

```typescript
interface SubmitDepositTxRequest {
  txHash: string;           // Transaction hash from blockchain
  depositAddress: string;   // Deposit address from quote
}
```

#### Response

```typescript
interface SubmitDepositTxResponse {
  success: boolean;
  message?: string;
}
```

#### Example Usage

```typescript
// After sending tokens to deposit address
const txHash = '0x123...abc';  // From blockchain transaction
const depositAddress = quote.quote.depositAddress;

const result = await SFA.submitDepositTx({
  txHash,
  depositAddress,
});

if (result.success) {
  console.log('Transaction submitted successfully!');
}
```

#### When to Call

1. **After** sending tokens to `depositAddress`
2. **After** transaction is confirmed on blockchain
3. **Before** checking execution status

---

### 4. `getExecutionStatus()`

Checks the current status of a cross-chain swap.

#### Signature

```typescript
SFA.getExecutionStatus(depositAddress: string): Promise<GetExecutionStatusResponse>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `depositAddress` | string | Deposit address from quote |

#### Response

```typescript
interface GetExecutionStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  depositTxHash?: string;
  destinationTxHash?: string;
  message?: string;
  updatedAt: string;
}
```

#### Example Usage

```typescript
const status = await SFA.getExecutionStatus(depositAddress);

switch (status.status) {
  case 'pending':
    console.log('Waiting for deposit confirmation...');
    break;
  case 'processing':
    console.log('Swap in progress...');
    break;
  case 'completed':
    console.log('Swap completed!');
    console.log('Destination tx:', status.destinationTxHash);
    break;
  case 'failed':
    console.log('Swap failed:', status.message);
    break;
}
```

#### Polling Example

```typescript
async function waitForCompletion(depositAddress: string) {
  const maxAttempts = 60;  // 5 minutes with 5s interval
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await SFA.getExecutionStatus(depositAddress);
    
    if (status.status === 'completed') {
      return status;
    }
    
    if (status.status === 'failed') {
      throw new Error(status.message);
    }
    
    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Timeout waiting for swap completion');
}
```

---

## Working Examples

The SDK includes a complete web application example demonstrating real-world usage.

### Web Demo Application

Location: `examples/web-demo/`

#### Features

- ✅ Real wallet connection (MetaMask)
- ✅ Network switching
- ✅ Token balance checking
- ✅ Quote generation
- ✅ Transaction execution
- ✅ Status tracking

#### Running the Example

```bash
cd examples/web-demo
npm install
npm run dev
```

#### Key Files to Study

1. **`app.ts`** - Main application logic
   - Wallet connection: `connectWallet()`
   - Network switching: `switchNetwork()`
   - Getting quotes: `handleGetQuote()`
   - Executing swaps: `executeBridge()`

2. **Network Configuration**
   ```typescript
   const SUPPORTED_NETWORKS = [
     {
       id: 'eth',
       name: 'Ethereum',
       chainId: 1,
       usdtContract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
       usdtAssetId: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
       decimals: 6
     },
     // ... more networks
   ];
   ```

3. **ERC20 Token Transfer**
   ```typescript
   // Create contract instance
   const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
   const usdtContract = new ethers.Contract(
     fromNetwork.usdtContract,
     erc20Abi,
     signer
   );
   
   // Execute transfer
   const tx = await usdtContract.transfer(depositAddress, amount);
   await tx.wait();
   ```

#### Learning Path

1. **Start with**: Understanding the flow in `app.ts`
2. **Study**: Network configuration and asset IDs
3. **Review**: Error handling patterns
4. **Examine**: UI/UX best practices
5. **Customize**: Adapt for your use case

---

## Best Practices

### 1. Error Handling

Always wrap SDK calls in try-catch blocks:

```typescript
import { ApiError } from 'stableflow-ai-sdk';

try {
  const quote = await SFA.getQuote(request);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        // Invalid request parameters
        console.error('Bad request:', error.body);
        break;
      case 401:
        // Authentication failed
        console.error('Invalid JWT token');
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

### 3. Deadline Management

Set reasonable deadlines:

```typescript
// Good: 24 hours from now
const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

// Bad: Past timestamp
const badDeadline = new Date('2020-01-01').toISOString();  // ❌

// Bad: Too short
const tooShort = new Date(Date.now() + 60 * 1000).toISOString();  // ❌
```

### 4. Network Validation

Validate network compatibility:

```typescript
async function validateNetworks(fromNetwork: string, toNetwork: string) {
  if (fromNetwork === toNetwork) {
    throw new Error('Source and destination networks must be different');
  }
  
  const tokens = await SFA.getTokens();
  const fromTokens = tokens.filter(t => t.blockchain === fromNetwork);
  const toTokens = tokens.filter(t => t.blockchain === toNetwork);
  
  if (fromTokens.length === 0) {
    throw new Error(`Network ${fromNetwork} not supported`);
  }
  
  if (toTokens.length === 0) {
    throw new Error(`Network ${toNetwork} not supported`);
  }
}
```

### 5. Status Polling

Implement exponential backoff:

```typescript
async function pollStatus(depositAddress: string) {
  let delay = 2000;  // Start with 2 seconds
  const maxDelay = 30000;  // Max 30 seconds
  const maxAttempts = 100;
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await SFA.getExecutionStatus(depositAddress);
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Exponential backoff
    delay = Math.min(delay * 1.5, maxDelay);
  }
  
  throw new Error('Polling timeout');
}
```

---

## Common Use Cases

### Use Case 1: Simple USDT Bridge

Bridge USDT from Ethereum to Arbitrum:

```typescript
// 1. Get tokens to find asset IDs
const tokens = await SFA.getTokens();
const ethUsdt = tokens.find(t => t.blockchain === 'eth' && t.symbol === 'USDT');
const arbUsdt = tokens.find(t => t.blockchain === 'arb' && t.symbol === 'USDT');

// 2. Create quote request
const quoteRequest: QuoteRequest = {
  dry: false,
  swapType: QuoteRequest.swapType.EXACT_INPUT,
  slippageTolerance: 100,
  originAsset: ethUsdt.assetId,
  destinationAsset: arbUsdt.assetId,
  amount: ethers.parseUnits('100', 6).toString(),  // 100 USDT
  depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
  refundTo: userEthAddress,
  refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
  recipient: userArbAddress,
  recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 3. Get quote
const quote = await SFA.getQuote(quoteRequest);

// 4. Transfer USDT to deposit address
const usdtContract = new ethers.Contract(
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  ['function transfer(address to, uint256 amount) returns (bool)'],
  signer
);
const tx = await usdtContract.transfer(
  quote.quote.depositAddress,
  ethers.parseUnits('100', 6)
);
await tx.wait();

// 5. Submit transaction
await SFA.submitDepositTx({
  txHash: tx.hash,
  depositAddress: quote.quote.depositAddress,
});

// 6. Monitor status
const finalStatus = await pollStatus(quote.quote.depositAddress);
console.log('Bridge completed!', finalStatus.destinationTxHash);
```

### Use Case 2: Dynamic Token Selection

Let users choose any supported token pair:

```typescript
async function buildTokenPairSelector() {
  const tokens = await SFA.getTokens();
  
  // Group by network
  const byNetwork = tokens.reduce((acc, token) => {
    if (!acc[token.blockchain]) {
      acc[token.blockchain] = [];
    }
    acc[token.blockchain].push(token);
    return acc;
  }, {} as Record<string, TokenResponse[]>);
  
  // Build UI options
  const networks = Object.keys(byNetwork);
  
  return {
    networks,
    getTokensForNetwork: (network: string) => byNetwork[network],
    findToken: (network: string, symbol: string) =>
      byNetwork[network]?.find(t => t.symbol === symbol),
  };
}
```

### Use Case 3: Fee Calculator

Calculate bridge fees before execution:

```typescript
async function calculateFees(
  fromToken: TokenResponse,
  toToken: TokenResponse,
  amount: string
) {
  const quoteRequest: QuoteRequest = {
    dry: true,  // Testing mode
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 100,
    originAsset: fromToken.assetId,
    destinationAsset: toToken.assetId,
    amount,
    // ... other required fields
  };
  
  const quote = await SFA.getQuote(quoteRequest);
  
  const feeUsd = parseFloat(quote.quote.amountInUsd) - 
                 parseFloat(quote.quote.amountOutUsd);
  const feePercent = (feeUsd / parseFloat(quote.quote.amountInUsd)) * 100;
  
  return {
    feeUsd: feeUsd.toFixed(4),
    feePercent: feePercent.toFixed(2),
    estimatedTime: quote.quote.timeEstimate,
    minimumReceived: quote.quote.amountOutFormatted,
  };
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid token" Error

**Cause**: Using incorrect `assetId` format

**Solution**: Always get asset IDs from `getTokens()`:
```typescript
const tokens = await SFA.getTokens();
const token = tokens.find(t => 
  t.blockchain === 'eth' && t.symbol === 'USDT'
);
// Use: token.assetId
```

#### 2. "Deadline is not valid" Error

**Cause**: Deadline is in the past or incorrect format

**Solution**: Use ISO 8601 format with future timestamp:
```typescript
const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
```

#### 3. Authentication Errors

**Cause**: Missing or invalid JWT token

**Solution**: 

**👉 [Apply for JWT Token Here](https://docs.google.com/forms/u/3/d/e/1FAIpQLSdTeV7UaZ1MiFxdJ2jH_PU60PIN3iqYJ1WXEOFY45TsAy6O5g/viewform)**

After receiving your token, set it before any API calls:
```typescript
OpenAPI.TOKEN = 'your-valid-token';
```

#### 4. Network Mismatch

**Cause**: Wallet on wrong network when sending transaction

**Solution**: Check and switch network before transaction:
```typescript
const currentChainId = await window.ethereum.request({ 
  method: 'eth_chainId' 
});

if (currentChainId !== expectedChainId) {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: expectedChainId }],
  });
}
```

#### 5. Transaction Stuck

**Cause**: Transaction not confirmed on blockchain

**Solution**: Wait for confirmation before submitting:
```typescript
const tx = await usdtContract.transfer(depositAddress, amount);
const receipt = await tx.wait();  // Wait for confirmation
console.log('Confirmed in block:', receipt.blockNumber);

// Now submit to StableFlow
await SFA.submitDepositTx({ txHash: tx.hash, depositAddress });
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
- Discord: [Join our community](https://discord.gg/stableflow)
- Twitter: [@StableFlowAI](https://twitter.com/stableflowai)

---

## Summary

### Quick Reference

| Function | Purpose | Required Fields |
|----------|---------|----------------|
| `getTokens()` | List supported tokens | JWT Token |
| `getQuote()` | Get swap quote | JWT Token, QuoteRequest |
| `submitDepositTx()` | Notify deposit | JWT Token, txHash, depositAddress |
| `getExecutionStatus()` | Check swap status | JWT Token, depositAddress |

### Integration Checklist

- [ ] Install SDK via npm
- [ ] Obtain JWT token from StableFlow
- [ ] Configure `OpenAPI.BASE` and `OpenAPI.TOKEN`
- [ ] Study web demo example
- [ ] Implement error handling
- [ ] Test with `dry: true` mode first
- [ ] Handle network switching
- [ ] Implement status polling
- [ ] Add user notifications
- [ ] Test with real transactions

---

**Happy Building! 🚀**

For questions or support, visit our [GitHub repository](https://github.com/stableflow-ai/stableflow-ai-sdk) or join our [Discord community](https://discord.gg/stableflow).

