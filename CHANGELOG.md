# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-24

### 初始发布 | Initial Release

#### ✨ 新功能 | Features

- 🚀 完整的跨链代币交换 SDK
- 💎 完整的 TypeScript 类型支持
- 🔐 JWT 认证支持（静态和动态 Token）
- 📦 支持 CommonJS 和 ES Module
- 🎯 类型安全的 API 调用
- ⚡ 基于 axios 的高性能 HTTP 客户端
- 🔄 可取消的 Promise 支持
- 📝 完整的中英文文档

#### 🛠️ API Methods

- `SFA.getTokens()` - 获取支持的代币列表
- `SFA.getQuote()` - 创建交换报价
- `SFA.submitDepositTx()` - 提交存款交易
- `SFA.getExecutionStatus()` - 查询交换状态

#### 📚 文档

- README.md - 项目主文档
- QUICK_START.md - 快速开始指南
- PROJECT_STRUCTURE.md - 项目结构说明
- examples/ - 完整示例代码

#### 🔧 技术栈

- TypeScript 5.4+
- axios 1.6+
- tsup 8.0+ (构建工具)
- Node.js >= 16

#### 📦 包格式

- CommonJS (dist/index.js)
- ES Module (dist/index.mjs)
- TypeScript 类型定义 (dist/index.d.ts, dist/index.d.mts)

---

## [Unreleased]

### 计划功能 | Planned Features

- [ ] WebSocket 支持实时状态更新
- [ ] 批量交换支持
- [ ] 更多区块链网络支持
- [ ] 交换历史查询
- [ ] 费用估算工具
- [ ] React Hooks 集成
- [ ] CLI 工具

---

## 版本说明 | Version Notes

### 语义化版本控制

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

### 维护计划

- 🐛 Bug 修复: 持续进行
- 🔒 安全更新: 优先处理
- ✨ 新功能: 根据用户反馈和路线图

---

## 贡献者 | Contributors

感谢所有为这个项目做出贡献的人！

---

## 链接 | Links

- [GitHub Repository](https://github.com/stableflow-ai/stableflow-ai-sdk)
- [npm Package](https://www.npmjs.com/package/stableflow-ai-sdk)
- [Documentation](https://docs.stableflow.ai)
- [API Reference](https://api.stableflow.ai/docs)

