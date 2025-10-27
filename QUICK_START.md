# 快速开始指南 | Quick Start Guide

## 5分钟上手 StableFlow AI SDK

### 第一步：安装

```bash
npm install stableflow-ai-sdk
# 或
yarn add stableflow-ai-sdk
```

### 第二步：初始化

创建一个新文件 `app.ts`:

```typescript
import { OpenAPI, SFA, QuoteRequest } from 'stableflow-ai-sdk';

// 配置 API 基础地址
OpenAPI.BASE = 'https://api.stableflow.ai';

// 配置 JWT Token（必需）
OpenAPI.TOKEN = 'your-jwt-token-here';
```

### 第三步：获取支持的代币

```typescript
async function getTokens() {
    try {
        const tokens = await SFA.getTokens();
        console.log('支持的代币:', tokens);
        return tokens;
    } catch (error) {
        console.error('获取代币失败:', error);
    }
}

getTokens();
```

### 第四步：创建交换请求

```typescript
async function createSwap() {
    try {
        const quoteRequest: QuoteRequest = {
            dry: false, // false = 真实交换, true = 测试模式
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageTolerance: 100, // 1% 滑点
            
            // 源链资产
            originAsset: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
            depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
            
            // 目标链资产
            destinationAsset: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',
            
            // 金额（最小单位）
            amount: '1000000', // 1 USDC
            
            // 退款地址
            refundTo: '0xYourWalletAddress',
            refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
            
            // 接收地址
            recipient: 'YourSolanaAddress',
            recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
            
            // 截止时间
            deadline: '2025-12-31T23:59:59Z'
        };

        const quote = await SFA.getQuote(quoteRequest);
        console.log('报价:', quote);
        console.log('存款地址:', quote.quote.depositAddress);
        
        return quote;
    } catch (error) {
        console.error('创建交换失败:', error);
    }
}

createSwap();
```

### 第五步：查询交换状态

```typescript
async function checkStatus(depositAddress: string) {
    try {
        const status = await SFA.getExecutionStatus(depositAddress);
        console.log('交换状态:', status.status);
        console.log('详细信息:', status.swapDetails);
        
        return status;
    } catch (error) {
        console.error('查询状态失败:', error);
    }
}

// 使用示例
checkStatus('0xDepositAddress...');
```

## 完整示例

```typescript
import { OpenAPI, SFA, QuoteRequest, ApiError } from 'stableflow-ai-sdk';

// 1. 配置
OpenAPI.BASE = 'https://api.stableflow.ai';
OpenAPI.TOKEN = 'your-jwt-token';

async function swapWorkflow() {
    try {
        // 2. 获取支持的代币
        const tokens = await SFA.getTokens();
        console.log(`支持 ${tokens.length} 种代币`);
        
        // 3. 创建报价请求
        const quoteRequest: QuoteRequest = {
            dry: true, // 测试模式
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageTolerance: 100,
            originAsset: tokens[0].assetId, // 使用第一个代币
            depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
            destinationAsset: tokens[1].assetId, // 交换到第二个代币
            amount: '1000000',
            refundTo: '0xYourAddress',
            refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
            recipient: 'YourRecipientAddress',
            recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
            deadline: new Date(Date.now() + 3600000).toISOString() // 1小时后
        };
        
        // 4. 获取报价
        const quote = await SFA.getQuote(quoteRequest);
        console.log('预计获得:', quote.quote.amountOutFormatted);
        console.log('存款地址:', quote.quote.depositAddress);
        
        // 5. 用户向存款地址转账后，提交交易哈希
        if (!quoteRequest.dry && quote.quote.depositAddress) {
            await SFA.submitDepositTx({
                depositAddress: quote.quote.depositAddress,
                txHash: '0xYourTransactionHash'
            });
            console.log('交易已提交');
        }
        
        // 6. 查询状态
        if (quote.quote.depositAddress) {
            const status = await SFA.getExecutionStatus(quote.quote.depositAddress);
            console.log('当前状态:', status.status);
        }
        
    } catch (error) {
        if (error instanceof ApiError) {
            console.error(`API 错误 [${error.status}]:`, error.body);
        } else {
            console.error('未知错误:', error);
        }
    }
}

swapWorkflow();
```

## 错误处理

```typescript
import { ApiError } from 'stableflow-ai-sdk';

try {
    const quote = await SFA.getQuote(request);
} catch (error) {
    if (error instanceof ApiError) {
        switch (error.status) {
            case 400:
                console.error('请求参数错误:', error.body);
                break;
            case 401:
                console.error('认证失败，请检查 JWT Token');
                break;
            case 404:
                console.error('资源不存在');
                break;
            default:
                console.error('API 错误:', error.message);
        }
    } else {
        console.error('网络或其他错误:', error);
    }
}
```

## 动态 Token 刷新

```typescript
// 使用函数动态获取 Token
OpenAPI.TOKEN = async () => {
    // 从你的认证服务获取新 Token
    const response = await fetch('https://your-auth-service.com/refresh-token');
    const data = await response.json();
    return data.token;
};
```

## 常见问题

### Q: 如何获取 JWT Token?
A: 请联系 StableFlow AI 团队申请 API 访问权限和 JWT Token。

### Q: dry 模式是什么？
A: `dry: true` 是测试模式，不会生成真实的存款地址，用于验证参数和预览结果。

### Q: amount 参数如何填写？
A: amount 使用代币的最小单位。例如：
- 1 USDC = 1000000（6位小数）
- 1 ETH = 1000000000000000000（18位小数）

### Q: 如何选择 assetId？
A: 先调用 `SFA.getTokens()` 获取所有支持的代币，使用返回的 `assetId` 字段。

## 下一步

- 查看完整文档：[README.md](./README.md)
- 查看项目结构：[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- 查看更多示例：[examples/](./examples/)

## 需要帮助？

- 📧 Email: support@stableflow.ai
- 📚 文档: https://docs.stableflow.ai
- 💬 Discord: https://discord.gg/stableflow

