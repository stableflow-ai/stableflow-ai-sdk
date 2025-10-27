# StableFlow AI SDK - 项目结构说明

## 目录结构

```
stableflow-ai-sdk/
├── src/                          # 源代码目录
│   ├── core/                     # 核心功能模块
│   │   ├── ApiError.ts          # API 错误处理类
│   │   ├── ApiRequestOptions.ts # API 请求选项类型定义
│   │   ├── ApiResult.ts         # API 返回结果类型定义
│   │   ├── CancelablePromise.ts # 可取消的 Promise 实现
│   │   ├── OpenAPI.ts           # OpenAPI 配置
│   │   └── request.ts           # HTTP 请求封装（基于 axios）
│   ├── models/                   # 数据模型定义
│   │   ├── AppFee.ts            # 应用费用模型
│   │   ├── BadRequestResponse.ts # 错误响应模型
│   │   ├── GetExecutionStatusResponse.ts # 执行状态响应模型
│   │   ├── Quote.ts             # 报价模型
│   │   ├── QuoteRequest.ts      # 报价请求模型
│   │   ├── QuoteResponse.ts     # 报价响应模型
│   │   ├── SubmitDepositTxRequest.ts # 提交存款交易请求模型
│   │   ├── SubmitDepositTxResponse.ts # 提交存款交易响应模型
│   │   ├── SwapDetails.ts       # 交换详情模型
│   │   ├── TokenResponse.ts     # 代币响应模型
│   │   └── TransactionDetails.ts # 交易详情模型
│   ├── services/                 # 服务层
│   │   └── SFA.ts               # StableFlow AI 主服务类
│   └── index.ts                  # 主入口文件，导出所有公共 API
├── examples/                     # 示例代码
│   ├── basic-swap-flow.ts       # 基础交换流程示例
│   ├── package.json             # 示例项目配置
│   ├── tsconfig.json            # 示例 TypeScript 配置
│   └── README.md                # 示例说明文档
├── dist/                         # 构建输出目录（npm run build 后生成）
│   ├── index.js                 # CommonJS 格式
│   ├── index.mjs                # ES Module 格式
│   ├── index.d.ts               # TypeScript 类型定义（CommonJS）
│   └── index.d.mts              # TypeScript 类型定义（ESM）
├── package.json                  # 项目配置文件
├── tsconfig.json                 # TypeScript 编译配置
├── LICENSE                       # MIT 许可证
└── README.md                     # 项目说明文档

```

## 核心模块说明

### 1. Core 模块 (`src/core/`)

核心模块提供了 SDK 的基础功能：

- **OpenAPI.ts**: 配置 API 基础 URL、版本号、认证信息等
- **request.ts**: 封装 axios 进行 HTTP 请求，支持：
  - JWT 认证
  - 请求/响应拦截
  - 错误处理
  - 表单数据处理
- **ApiError.ts**: 统一的错误处理类
- **CancelablePromise.ts**: 支持取消的 Promise 实现

### 2. Models 模块 (`src/models/`)

定义了所有与 API 交互的数据模型，包括：

- 请求类型（Request）
- 响应类型（Response）
- 枚举类型（Enums）
- 完整的 TypeScript 类型支持

### 3. Services 模块 (`src/services/`)

**SFA 类**是主要的服务接口，提供以下方法：

```typescript
// 获取支持的代币列表
SFA.getTokens(): Promise<TokenResponse[]>

// 获取交换报价
SFA.getQuote(request: QuoteRequest): Promise<QuoteResponse>

// 提交存款交易
SFA.submitDepositTx(request: SubmitDepositTxRequest): Promise<SubmitDepositTxResponse>

// 查询执行状态
SFA.getExecutionStatus(depositAddress: string, depositMemo?: string): Promise<GetExecutionStatusResponse>
```

## API 端点映射

SDK 封装了以下 API 端点：

| SDK 方法 | HTTP 方法 | API 端点 | 需要认证 |
|---------|----------|---------|---------|
| `SFA.getTokens()` | GET | `/v0/tokens` | ❌ |
| `SFA.getQuote()` | POST | `/v0/quote` | ✅ |
| `SFA.submitDepositTx()` | POST | `/v0/deposit/submit` | ✅ |
| `SFA.getExecutionStatus()` | GET | `/v0/status` | ✅ |

## 使用流程

### 1. 配置 SDK

```typescript
import { OpenAPI } from 'stableflow-ai-sdk';

// 设置 API 基础 URL
OpenAPI.BASE = 'https://api.stableflow.ai';

// 设置 JWT Token
OpenAPI.TOKEN = 'your-jwt-token';
```

### 2. 使用服务

```typescript
import { SFA, QuoteRequest } from 'stableflow-ai-sdk';

// 获取报价
const quote = await SFA.getQuote({
    dry: true,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    // ... 其他参数
});
```

## 构建和发布

### 构建命令

```bash
# 安装依赖
npm install

# 构建（生成 dist 目录）
npm run build

# 清理构建产物
npm run clean

# 开发模式（监听文件变化）
npm run dev
```

### 构建产物

- `dist/index.js` - CommonJS 格式，用于 Node.js require()
- `dist/index.mjs` - ES Module 格式，用于 import
- `dist/index.d.ts` - TypeScript 类型定义（CJS）
- `dist/index.d.mts` - TypeScript 类型定义（ESM）

## 技术栈

- **TypeScript** - 类型安全的 JavaScript 超集
- **axios** - HTTP 客户端
- **form-data** - 表单数据处理
- **tsup** - TypeScript 打包工具（快速、无配置）

## 与原项目的差异

| 项目 | 原项目 | StableFlow AI SDK |
|-----|--------|-------------------|
| 包名 | `@defuse-protocol/one-click-sdk-typescript` | `stableflow-ai-sdk` |
| 主服务类 | `OneClickService` | `SFA` |
| 默认 API URL | `https://1click.chaindefuser.com` | `https://api.stableflow.ai` |
| 许可证 | ISC | MIT |

## 注意事项

1. **API 地址**: 默认 API 地址为 `https://api.stableflow.ai`，请根据实际部署修改
2. **JWT 认证**: 大部分端点需要 JWT Token，请在使用前配置
3. **类型安全**: 所有接口都有完整的 TypeScript 类型定义
4. **错误处理**: 使用 try-catch 捕获 `ApiError` 进行错误处理

## 扩展开发

如果需要添加新的 API 端点：

1. 在 `src/models/` 中定义请求和响应类型
2. 在 `src/services/SFA.ts` 中添加新的静态方法
3. 在 `src/index.ts` 中导出新类型
4. 重新构建项目

## 支持

如有问题或需要帮助，请：
- 查看 README.md 文档
- 查看 examples/ 目录中的示例代码
- 提交 Issue 或 Pull Request

