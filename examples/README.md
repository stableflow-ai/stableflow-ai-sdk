# StableFlow AI SDK Examples

本目录包含 StableFlow AI SDK 的使用示例。

This directory contains usage examples for the StableFlow AI SDK.

## 运行示例 | Running Examples

1. 安装依赖 | Install dependencies:
```bash
npm install
```

2. 配置你的 JWT Token | Configure your JWT Token:
编辑 `basic-swap-flow.ts` 文件，将 `YOUR_JWT_TOKEN` 替换为你的实际 JWT token。

Edit `basic-swap-flow.ts` and replace `YOUR_JWT_TOKEN` with your actual JWT token.

3. 运行示例 | Run the example:
```bash
npm start
```

## 示例说明 | Examples Description

### basic-swap-flow.ts

演示完整的代币交换流程：

Demonstrates the complete token swap flow:

1. 获取支持的代币列表 | Get list of supported tokens
2. 请求交换报价 | Request a swap quote
3. 提交存款交易 | Submit deposit transaction
4. 查询执行状态 | Check execution status
5. JWT Token 刷新处理 | JWT Token refresh handling

## 注意事项 | Notes

- 示例代码中使用 `dry: true` 模式进行测试，不会生成真实的存款地址
- The example uses `dry: true` mode for testing and won't generate real deposit addresses
- 在生产环境中使用前，请确保你理解每个参数的含义
- Make sure you understand each parameter before using in production

