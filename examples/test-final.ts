// Final test: Verify API works without JWT token
import { SFA, QuoteRequest } from "stableflow-ai-sdk";

async function test() {
	console.log("🎯 Final Test: API without JWT token\n");

	try {
		// 1. Get tokens
		const tokens = await SFA.getTokens();
		console.log(`✅ getTokens(): ${tokens.length} tokens\n`);

		// 2. Get quote
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
		console.log(`✅ getQuote(): Success!`);
		console.log(`   Input: ${quote.quote?.amountInFormatted} USDC`);
		console.log(`   Output: ${quote.quote?.amountOutFormatted} USDC`);
		console.log(`   Estimate: ${quote.quote?.timeEstimate} seconds`);

		console.log(
			"\n🎉 All tests passed! API works without JWT token!\n"
		);
	} catch (error: any) {
		console.error("❌ Error:", error.message);
		if (error.body) {
			console.error("Body:", error.body);
		}
	}
}

test();

