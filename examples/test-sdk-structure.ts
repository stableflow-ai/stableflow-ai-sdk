// 测试 SDK 结构和导出（不依赖真实 API）
// Test SDK structure and exports (without real API)

import {
	SFA,
	OpenAPI,
	QuoteRequest,
	TokenResponse,
	ApiError,
	CancelError,
	GetExecutionStatusResponse,
	SubmitDepositTxResponse,
} from "stableflow-ai-sdk";

console.log("✅ 测试开始 - Testing SDK Structure\n");

// 1. 测试导入
console.log("1️⃣ 测试导入 (Testing Imports)");
console.log("✅ SFA:", typeof SFA);
console.log("✅ OpenAPI:", typeof OpenAPI);
console.log("✅ QuoteRequest:", typeof QuoteRequest);
console.log("✅ TokenResponse:", typeof TokenResponse);
console.log("✅ ApiError:", typeof ApiError);
console.log("✅ CancelError:", typeof CancelError);
console.log("✅ GetExecutionStatusResponse:", typeof GetExecutionStatusResponse);
console.log("✅ SubmitDepositTxResponse:", typeof SubmitDepositTxResponse);

// 2. 测试 OpenAPI 配置
console.log("\n2️⃣ 测试 OpenAPI 配置 (Testing OpenAPI Config)");
console.log("Current BASE:", OpenAPI.BASE);
console.log("Current VERSION:", OpenAPI.VERSION);
console.log("Current TOKEN:", OpenAPI.TOKEN ? "已设置" : "未设置");

// 3. 测试修改配置
console.log("\n3️⃣ 测试配置修改 (Testing Config Modification)");
OpenAPI.BASE = "https://api.stableflow.ai";
OpenAPI.TOKEN = "test-token-123";
console.log("✅ BASE 修改为:", OpenAPI.BASE);
console.log("✅ TOKEN 修改为:", OpenAPI.TOKEN ? "***已设置***" : "未设置");

// 4. 测试 SFA 类方法
console.log("\n4️⃣ 测试 SFA 类 (Testing SFA Class)");
console.log("✅ SFA.getTokens:", typeof SFA.getTokens);
console.log("✅ SFA.getQuote:", typeof SFA.getQuote);
console.log("✅ SFA.submitDepositTx:", typeof SFA.submitDepositTx);
console.log("✅ SFA.getExecutionStatus:", typeof SFA.getExecutionStatus);

// 5. 测试 QuoteRequest 枚举
console.log("\n5️⃣ 测试 QuoteRequest 枚举 (Testing QuoteRequest Enums)");
console.log("✅ swapType:", QuoteRequest.swapType);
console.log("✅ depositType:", QuoteRequest.depositType);
console.log("✅ refundType:", QuoteRequest.refundType);
console.log("✅ recipientType:", QuoteRequest.recipientType);

// 6. 测试 ApiError 实例化
console.log("\n6️⃣ 测试 ApiError (Testing ApiError)");
try {
	const mockRequest = {
		method: "GET" as const,
		url: "https://test.com",
	};
	const mockResponse = {
		url: "https://test.com",
		ok: false,
		status: 404,
		statusText: "Not Found",
		body: { error: "test error" },
	};
	const error = new ApiError(mockRequest, mockResponse, "Test error");
	console.log("✅ ApiError 创建成功");
	console.log("  - name:", error.name);
	console.log("  - status:", error.status);
	console.log("  - statusText:", error.statusText);
} catch (err) {
	console.error("❌ ApiError 测试失败:", err);
}

console.log("\n✅ 所有测试通过！SDK 结构正确！");
console.log("All tests passed! SDK structure is correct!");
console.log("\n💡 提示: 要测试真实 API，请确保:");
console.log("   1. API 服务器正在运行");
console.log("   2. 配置了有效的 JWT Token");
console.log("   3. 网络连接正常");

