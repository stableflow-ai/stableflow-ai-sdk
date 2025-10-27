// 测试带 JWT token 的 API
import { SFA, OpenAPI, QuoteRequest } from "stableflow-ai-sdk";

// 配置 JWT Token
OpenAPI.TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjQxNTA2MjUsImlhdCI6MTc2MTU1ODYyNSwidXNlcl9pZCI6Mjl9.LYgx-jtL4YpeuWctzSGpk_bZQv8wIeMbbLiTzrVO9ZE";

async function test() {
	console.log("🧪 Testing API with JWT Token\n");

	try {
		// 1. Get tokens
		console.log("1️⃣ Testing getTokens()...");
		const tokens = await SFA.getTokens();
		console.log(`✅ Success! Found ${tokens.length} tokens\n`);

		// 2. Get quote
		console.log("2️⃣ Testing getQuote()...");
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
			deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			quoteWaitingTimeMs: 3000,
		};

		const quote = await SFA.getQuote(quoteRequest);
		console.log(`✅ Success!`);
		console.log(`   Input: ${quote.quote?.amountInFormatted} USDC`);
		console.log(`   Output: ${quote.quote?.amountOutFormatted} USDC`);
		console.log(`   Estimate: ${quote.quote?.timeEstimate} seconds`);

		console.log("\n🎉 All tests passed with JWT token!\n");
	} catch (error: any) {
		console.error("❌ Error:", error.message);
		if (error.status) {
			console.error("Status:", error.status);
		}
		if (error.body) {
			console.error("Body:", JSON.stringify(error.body, null, 2));
		}
	}
}

test();

