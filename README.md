# StableFlow AI SDK - TypeScript

一个强大的 TypeScript SDK，用于无缝跨链代币交换。基于类型安全设计，该 SDK 使开发人员能够轻松地将跨链交换功能集成到他们的应用程序中，只需最少的设置。

A powerful TypeScript SDK for seamless cross-chain token swaps. Built with type safety in mind, this SDK enables developers to easily integrate cross-chain swapping functionality into their applications with minimal setup.

## 前置要求 | Prerequisites

- Node.js >= 16
- npm / yarn / pnpm

## 安装 | Installation

```bash
# Using npm
npm install stableflow-ai-sdk

# Using yarn
yarn add stableflow-ai-sdk

# Using pnpm
pnpm add stableflow-ai-sdk
```

## 快速开始 | Quick Start

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

## API 方法 | API Methods

### 获取报价 | Get Quote

```typescript
const quote = await SFA.getQuote(quoteRequest);
```

### 获取执行状态 | Get Execution Status

```typescript
const status = await SFA.getExecutionStatus(depositAddress);
```

### 提交存款交易 | Submit Deposit Transaction

```typescript
const result = await SFA.submitDepositTx({
    txHash: '0x...',
    depositAddress: '0x...'
});
```

### 获取支持的代币 | Get Supported Tokens

```typescript
const tokens = await SFA.getTokens();
```

## 认证 | Authentication

StableFlow AI API 需要 JWT 认证才能使用大部分端点。

The StableFlow AI API requires JWT authentication for most endpoints.

### 静态令牌 | Static Token (Required)

```typescript
// Set a static JWT - required for authenticated endpoints
OpenAPI.TOKEN = 'your-JSON-Web-Token';
```

### 动态令牌提供者 | Dynamic Token Provider (for token refresh)

```typescript
// Set a function that returns a fresh token when needed
OpenAPI.TOKEN = async () => {
  // Get a fresh token from your authentication system
  return 'FRESH_JWT';
};
```

### 受保护的端点 | Protected Endpoints

以下端点需要 JWT 认证 | The following endpoints require JWT authentication:
- `SFA.getQuote()`
- `SFA.submitDepositTx()`
- `SFA.getExecutionStatus()`

## 错误处理 | Error Handling

SDK 抛出可捕获和处理的类型化错误：

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

## 类型定义 | Type Definitions

SDK 提供完整的 TypeScript 类型定义，包括：

The SDK provides full TypeScript type definitions, including:

- `QuoteRequest` - 请求报价的参数 | Parameters for requesting a quote
- `QuoteResponse` - 报价响应数据 | Quote response data
- `GetExecutionStatusResponse` - 执行状态响应 | Execution status response
- `SubmitDepositTxRequest` - 提交存款交易请求 | Submit deposit transaction request
- `SubmitDepositTxResponse` - 提交存款交易响应 | Submit deposit transaction response
- `TokenResponse` - 代币信息 | Token information

## 示例 | Examples

查看 `examples` 目录获取更多示例：

Check the `examples` directory for more examples:

```bash
cd examples
npm install
npm start
```

## 开发 | Development

开发者命令 | Developer commands:

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

## 许可证 | License

MIT

## 支持 | Support

如遇到问题或需要帮助，请：

For issues or support:

- 提交 Issue | Open an issue on GitHub
- 查看文档 | Check the documentation
- 联系我们 | Contact our support team

## 更新日志 | Changelog

### v1.0.0
- 初始版本发布 | Initial release
- 支持跨链代币交换 | Support for cross-chain token swaps
- JWT 认证支持 | JWT authentication support
- 完整的 TypeScript 类型定义 | Full TypeScript type definitions

