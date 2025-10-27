// 使用包名导入（推荐方式）
// Use package name import (recommended)
import {
	SFA,
	OpenAPI,
	QuoteRequest,
	TokenResponse,
	ApiError,
} from "stableflow-ai-sdk";

// Configure the SDK
// Note: The default BASE is already set to "https://api.stableflow.ai/api"
// You can override it if needed:
// OpenAPI.BASE = "https://your-custom-api.com/api";

// JWT Token Configuration (OPTIONAL)
// This API does not require authentication for basic operations
// If your deployment requires authentication, set the token here:
// const JWT_TOKEN = "your-real-jwt-token-here";
// OpenAPI.TOKEN = JWT_TOKEN;

// Alternatively, you can use a dynamic token provider for automatic token refresh:
// OpenAPI.TOKEN = async () => {
//     // Get a fresh token from your authentication system
//     return await getNewToken();
// };

async function demonstrateSwapFlow() {
	try {
		// 1. Get available tokens (doesn't require authentication)
		console.log("Fetching available tokens...");
		const tokens = await SFA.getTokens();
		console.log(
			"Available tokens:",
			tokens.map((t: TokenResponse) => `${t.symbol} (${t.blockchain})`),
		);

		// 2. Request a quote (requires JWT authentication)
		console.log("\nRequesting quote with JWT authentication...");
		const quoteRequest: QuoteRequest = {
			dry: true, // Set to true for testing / false to get depositAddress and execute swap
			swapType: QuoteRequest.swapType.EXACT_INPUT,
			slippageTolerance: 100, // 1%
			originAsset:
				"nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", // USDC on Arbitrum
			depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
			destinationAsset:
				"nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near", // USDC on Solana
			amount: "1000000", // 1 USDC (in smallest units)
			refundTo: "0x2527D02599Ba641c19FEa793cD0F167589a0f10D", // Valid Arbitrum address
			refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
			recipient: "13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK", // Valid Solana Address
			recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
			deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
			referral: "your-referral-id",
			quoteWaitingTimeMs: 3000,
		};

		const quote = await SFA.getQuote(quoteRequest);
		console.log("Authenticated getQuote RESPONSE:", quote);

		// 3. Submit deposit transaction (in real scenario, this would be after user sends the transaction)
		// Note: This endpoint requires JWT authentication
		if (quote.quote && quote.quote.depositAddress && !quoteRequest.dry) {
			console.log("\nSubmitting deposit transaction...");
			const depositTxRequest = {
				depositAddress: quote.quote.depositAddress,
				txHash: "0x123...", // Replace with actual transaction hash
			};

			const depositSubmission =
				await SFA.submitDepositTx(depositTxRequest);
			console.log("Deposit submission result:", depositSubmission);
		}

		// 4. Check execution status (requires JWT authentication)
		if (quote.quote && quote.quote.depositAddress && !quoteRequest.dry) {
			console.log("\nChecking execution status with JWT authentication...");
			const status = await SFA.getExecutionStatus(
				quote.quote.depositAddress
			);
			console.log("Current status:", status);
		}

		// 5. Example of handling JWT token refresh/expiration
		// In a real implementation, you would refresh the token when needed
		console.log("\nExample of refreshing JWT token:");
		OpenAPI.TOKEN = async () => {
			// This function would typically make a request to your auth server
			// to get a fresh JWT token when needed
			console.log("Token refresh function called");
			return "NEW_REFRESHED_JWT_TOKEN";
		};

		// Make another API call with the dynamic token provider
		console.log("\nMaking API call with dynamic token provider...");
		if (quote.quote && quote.quote.depositAddress) {
			await SFA.getExecutionStatus(quote.quote.depositAddress);
			console.log("Successfully used dynamic token provider");
		}
	} catch (error) {
		// Check for authentication errors
		if (error instanceof ApiError && error.status === 401) {
			console.error("Authentication failed: JWT token is missing or invalid");
		} else {
			console.error("Error in swap flow:", error);
		}
	}
}

// Run the demonstration
demonstrateSwapFlow().catch(console.error);

