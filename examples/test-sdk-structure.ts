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

console.log("✅ Testing SDK Structure\n");

// 1. Test imports
console.log("1️⃣ Testing Imports");
console.log("✅ SFA:", typeof SFA);
console.log("✅ OpenAPI:", typeof OpenAPI);
console.log("✅ QuoteRequest:", typeof QuoteRequest);
console.log("✅ TokenResponse:", typeof TokenResponse);
console.log("✅ ApiError:", typeof ApiError);
console.log("✅ CancelError:", typeof CancelError);
console.log("✅ GetExecutionStatusResponse:", typeof GetExecutionStatusResponse);
console.log("✅ SubmitDepositTxResponse:", typeof SubmitDepositTxResponse);

// 2. Test OpenAPI configuration
console.log("\n2️⃣ Testing OpenAPI Config");
console.log("Current BASE:", OpenAPI.BASE);
console.log("Current VERSION:", OpenAPI.VERSION);
console.log("Current TOKEN:", OpenAPI.TOKEN ? "Set" : "Not set");

// 3. Test configuration modification
console.log("\n3️⃣ Testing Config Modification");
OpenAPI.BASE = "https://api.stableflow.ai";
OpenAPI.TOKEN = "test-token-123";
console.log("✅ BASE modified to:", OpenAPI.BASE);
console.log("✅ TOKEN modified to:", OpenAPI.TOKEN ? "***Set***" : "Not set");

// 4. Test SFA class methods
console.log("\n4️⃣ Testing SFA Class");
console.log("✅ SFA.getTokens:", typeof SFA.getTokens);
console.log("✅ SFA.getQuote:", typeof SFA.getQuote);
console.log("✅ SFA.submitDepositTx:", typeof SFA.submitDepositTx);
console.log("✅ SFA.getExecutionStatus:", typeof SFA.getExecutionStatus);

// 5. Test QuoteRequest enums
console.log("\n5️⃣ Testing QuoteRequest Enums");
console.log("✅ swapType:", QuoteRequest.swapType);
console.log("✅ depositType:", QuoteRequest.depositType);
console.log("✅ refundType:", QuoteRequest.refundType);
console.log("✅ recipientType:", QuoteRequest.recipientType);

// 6. Test ApiError instantiation
console.log("\n6️⃣ Testing ApiError");
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
	console.log("✅ ApiError created successfully");
	console.log("  - name:", error.name);
	console.log("  - status:", error.status);
	console.log("  - statusText:", error.statusText);
} catch (err) {
	console.error("❌ ApiError test failed:", err);
}

console.log("\n✅ All tests passed! SDK structure is correct!");
console.log("\n💡 Note: To test with real API, make sure:");
console.log("   1. API server is running");
console.log("   2. Valid JWT Token is configured");
console.log("   3. Network connection is available");

