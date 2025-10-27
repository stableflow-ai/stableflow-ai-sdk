// 测试不需要认证的 API（getTokens）
// Test APIs that don't require authentication (getTokens)

import { SFA, OpenAPI } from "stableflow-ai-sdk";

// 配置 API 地址（不需要设置 TOKEN）
OpenAPI.BASE = "https://1click.chaindefuser.com";

async function testPublicAPI() {
	console.log("🧪 Testing public API (no authentication required)\n");

	try {
		// 获取代币列表（不需要认证）
		console.log("📡 Fetching tokens...");
		const tokens = await SFA.getTokens();

		console.log(`\n✅ Success! Found ${tokens.length} tokens\n`);

		// 显示前 10 个代币
		console.log("📋 First 10 tokens:");
		tokens.slice(0, 10).forEach((token, index) => {
			console.log(
				`  ${index + 1}. ${token.symbol.padEnd(15)} (${token.blockchain.padEnd(8)}) - $${token.price}`
			);
		});

		// 统计各链代币数量
		const blockchainCounts = tokens.reduce((acc: any, token) => {
			acc[token.blockchain] = (acc[token.blockchain] || 0) + 1;
			return acc;
		}, {});

		console.log("\n📊 Tokens per blockchain:");
		Object.entries(blockchainCounts)
			.sort(([, a]: any, [, b]: any) => b - a)
			.forEach(([blockchain, count]) => {
				console.log(`  ${blockchain.padEnd(10)} : ${count}`);
			});
	} catch (error) {
		console.error("❌ Error:", error);
	}
}

testPublicAPI();

