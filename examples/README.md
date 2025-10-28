# StableFlow AI SDK Examples

This directory contains usage examples for the StableFlow AI SDK.

## 🚀 Quick Start

### Web Demo (Recommended)

**NEW!** Try our interactive web application with real wallet connection:

```bash
cd web-demo
npm install
npm run dev
```

Features:
- 🔗 Real wallet connection (MetaMask)
- 💱 Beautiful modern UI
- 🚀 Execute real transactions
- 📊 Transaction history

See [web-demo/README.md](web-demo/README.md) for details.

### Command Line Demo

Check out our [Interactive CLI Bridge Demo](QUICK_START_DEMO.md):

```bash
npm install
export STABLEFLOW_JWT_TOKEN='your-token'
npm run demo
```

## Running Examples

1. Install dependencies:
```bash
npm install
```

2. Configure your JWT Token:

Edit `basic-swap-flow.ts` and replace the JWT token with your actual token.

3. Run the example:
```bash
npm start
```

## Examples Description

### web-demo/ (Web Application) ⭐ NEW!

**🌟 Recommended for production use!**

A modern web application with real wallet connection and beautiful UI.

Features:
- 🔗 Connect MetaMask or compatible wallets
- 🎨 Modern dark theme UI with gradients
- 💱 Select from 21+ networks and 110+ tokens
- 💰 Real-time quotes with fee breakdown
- 🚀 Execute real bridge transactions
- 📊 Transaction history tracking
- 📱 Responsive design

**Stack**: TypeScript + Vite + ethers.js

Run with:
```bash
cd web-demo
npm install
npm run dev
```

See [web-demo/README.md](web-demo/README.md) for full documentation.

### cross-chain-bridge-demo.ts (CLI Demo)

An interactive command-line demo that simulates the main functionality of https://app.stableflow.ai/

Features:
- Select FROM and TO networks
- Choose tokens (USDT by default)
- Get real-time quote with fee estimation
- View estimated transaction time
- Execute real cross-chain transactions
- Track transaction status

Run with:
```bash
npm run demo
# or
npm run bridge
```

### basic-swap-flow.ts

A programmatic example demonstrating the complete token swap flow:

1. Get list of supported tokens
2. Request a swap quote
3. Submit deposit transaction
4. Check execution status
5. JWT Token refresh handling

Run with:
```bash
npm start
```

### test-sdk-structure.ts

A utility script to test the SDK structure and exports without making API calls.

Features:
- Verify SDK imports work correctly
- Test OpenAPI configuration
- Check all exported types and classes
- Validate SDK structure

Run with:
```bash
npx tsx test-sdk-structure.ts
```

### update-asset-ids.ts (Maintenance Tool)

A utility to fetch current USDT Asset IDs from the StableFlow API.

**Use this when**:
- Web demo reports "tokenOut is not valid" errors
- Asset ID formats change in the API
- Need to add/update supported networks

Features:
- Fetches latest USDT asset IDs from API
- Generates TypeScript code to copy
- Shows Asset ID format analysis (nep141 vs nep245)
- Lists all available blockchain IDs

Run with:
```bash
npx tsx update-asset-ids.ts
```

Then copy the generated `SUPPORTED_NETWORKS` configuration to `web-demo/app.ts`.

## Notes

- The `cross-chain-bridge-demo.ts` uses `dry: false` mode to get real deposit addresses (requires JWT token)
- The `basic-swap-flow.ts` uses `dry: true` mode for testing
- Make sure you understand each parameter before using in production
- Keep your JWT token secure and never commit it to version control

