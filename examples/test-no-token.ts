// 测试不使用任何 Token 的情况
// Test without any token

import { SFA, OpenAPI, QuoteRequest } from "stableflow-ai-sdk";

// 配置 API 地址（注意：需要包含 /api）
OpenAPI.BASE = "https://api.stableflow.ai/api";

// 🔥 完全不设置 TOKEN（注释掉）
// OpenAPI.TOKEN = undefined;  // 默认就是 undefined

async function testWithoutToken() {
	console.log("🧪 Testing API without any JWT token\n");

	try {
		// 1. 测试获取代币列表
		console.log("1️⃣ Testing getTokens() without token...");
		const tokens = await SFA.getTokens();
		console.log(`✅ Success! Found ${tokens.length} tokens\n`);

		// 2. 测试获取报价（不设置 token）
		console.log("2️⃣ Testing getQuote() without token...");
		const quoteRequest: QuoteRequest = {
			dry: true,
			swapType: QuoteRequest.swapType.EXACT_INPUT,
			slippageTolerance: 100,
			originAsset:
				"nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near",
			depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
			destinationAsset:
				"nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near",
			amount: "1000000",
			refundTo: "0x2527D02599Ba641c19FEa793cD0F167589a0f10D",
			refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
			recipient: "13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK",
			recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
			deadline: "2025-12-31T23:59:59Z",
			quoteWaitingTimeMs: 3000,
		};

		const quote = await SFA.getQuote(quoteRequest);
		console.log("✅ Quote received successfully!");
		console.log("Quote details:", JSON.stringify(quote, null, 2));
	} catch (error: any) {
		console.error("❌ Error:", error.message);
		if (error.status) {
			console.error("Status:", error.status);
			console.error("Body:", JSON.stringify(error.body, null, 2));
		}
	}
}

testWithoutToken();

