# StableFlow Cross-Chain Bridge - Web Demo

A modern, interactive web application for cross-chain token bridging with real wallet connection and transaction execution.

## Features

- 🔗 **Real Wallet Connection** - Connect MetaMask or other Web3 wallets
- 🌐 **6 Major Networks** - Ethereum, Arbitrum, Polygon, BNB Chain, Optimism, Avalanche
- 💰 **USDT Bridging** - Focused on USDT cross-chain transfers
- 💵 **Real-Time Quotes** - Get accurate quotes with fee and time estimates
- 🚀 **Transaction Execution** - Execute real cross-chain bridge transactions
- 📊 **Transaction History** - Track your bridging transactions
- 🎨 **Modern UI** - Beautiful, responsive interface with dark theme
- ⚡ **Instant Loading** - Hardcoded network configuration for fast startup

## Prerequisites

- Node.js >= 16
- MetaMask or compatible Web3 wallet browser extension
- JWT token from [StableFlow](https://app.stableflow.ai/)

## Installation

```bash
cd examples/web-demo
npm install
```

## Configuration

### Option 1: Environment Variable (Recommended)

1. Copy the environment template:
```bash
cp env.template .env
```

2. Edit `.env` and add your JWT token:
```
VITE_STABLEFLOW_JWT_TOKEN=your-jwt-token-here
```

### Option 2: Direct Configuration

Edit `app.ts` and set the JWT token:
```typescript
const JWT_TOKEN = 'your-jwt-token-here';
```

## Running the App

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
npm run preview
```

## How to Use

### 1. Connect Wallet

Click "Connect Wallet" button in the top right. MetaMask will prompt you to connect your wallet.

### 2. Select Networks

- **FROM Network**: Choose the source blockchain (e.g., Ethereum)
- **TO Network**: Choose the destination blockchain (e.g., Arbitrum)
- Only USDT will be bridged (automatically selected)

### 3. Enter Amount

Enter the USDT amount you want to bridge in the input field.

### 4. Get Quote

Click "Get Quote" to receive:
- Estimated output amount
- Fee calculation (absolute + percentage)
- Estimated transaction time
- Minimum output after slippage
- Deposit address

### 5. Execute Bridge

Click "Execute Bridge" to:
- Send funds to the deposit address
- Submit transaction hash to StableFlow
- Track the bridging progress

### 6. Track Status

View your transaction in the "Recent Transactions" section below the bridge form.

## Supported Networks

This demo supports 6 major EVM networks:

- **Ethereum** (eth) - USDT 6 decimals
- **Arbitrum** (arb) - USDT 6 decimals
- **Polygon** (pol) - USDT 6 decimals
- **BNB Chain** (bsc) - USDT 18 decimals ⚠️
- **Optimism** (op) - USDT 6 decimals
- **Avalanche** (avax) - USDT 6 decimals

Note: All networks use hardcoded USDT configurations for optimal performance.

## Example Workflows

### Bridge USDT from Ethereum to Arbitrum

1. Connect your MetaMask wallet
2. Select FROM: Ethereum
3. Select TO: Arbitrum
4. Enter amount: 100 (USDT is automatically selected)
5. Get quote and review details
6. Execute bridge and confirm transaction in MetaMask

### Bridge USDT from BNB Chain to Polygon

1. Connect wallet
2. FROM: BNB Chain
3. TO: Polygon
4. Enter amount: 50
5. Get quote
6. Execute and confirm

## Technical Details

### Architecture

```
Web UI (HTML/CSS/TypeScript)
    ↓
Vite (Build Tool)
    ↓
StableFlow SDK
    ↓
StableFlow API
```

### Technologies Used

- **Frontend**: TypeScript, HTML5, CSS3
- **Build Tool**: Vite
- **Web3**: ethers.js v6
- **SDK**: stableflow-ai-sdk
- **Wallet**: MetaMask (via window.ethereum)

### Key Components

- `app.ts` - Main application logic
- `index.html` - UI structure
- `styles.css` - Styling and animations
- `vite.config.ts` - Build configuration

## Security

⚠️ **Important Security Notes**:

1. **Never share your JWT token** publicly
2. **Always verify addresses** before confirming transactions
3. **Start with small amounts** when testing
4. **Double-check network selection** to avoid loss of funds
5. **Keep your wallet secure** and never share private keys

## Troubleshooting

### Wallet Connection Issues

**Problem**: "MetaMask not detected"

**Solution**: 
- Install MetaMask browser extension
- Refresh the page after installation

### Transaction Fails

**Problem**: Transaction rejected or fails

**Solution**:
- Check if you have sufficient balance
- Ensure correct network is selected in MetaMask
- Check gas fees are acceptable
- Verify token approval if using ERC20

### Quote Not Loading

**Problem**: "Failed to get quote"

**Solution**:
- Check JWT token is valid
- Ensure networks are different (FROM ≠ TO)
- Verify amount is greater than 0
- Check API connectivity

### Wrong Network

**Problem**: MetaMask is on wrong network

**Solution**:
- Switch to correct network in MetaMask
- App will detect network and update accordingly

## API Integration

The app uses the StableFlow AI SDK with hardcoded network configuration:

```typescript
// Hardcoded network configurations (no API call needed)
const SUPPORTED_NETWORKS = [
  { id: 'eth', name: 'Ethereum', usdtAssetId: '...', decimals: 6 },
  // ... other networks
];

// Get bridge quote (only API call on quote request)
const quote = await SFA.getQuote(quoteRequest);

// Submit transaction
await SFA.submitDepositTx({ txHash, depositAddress });

// Check status
const status = await SFA.getExecutionStatus(depositAddress);
```

## Development

### Project Structure

```
web-demo/
├── app.ts              # Main application logic
├── index.html          # HTML structure
├── styles.css          # CSS styling
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
└── README.md           # This file
```

### Adding New Features

1. Update `app.ts` for logic
2. Modify `index.html` for UI structure
3. Add styles to `styles.css`
4. Test with `npm run dev`

## Support

For issues or questions:

- 📖 Check the [StableFlow Documentation](https://docs.stableflow.ai/)
- 🌐 Visit [StableFlow App](https://app.stableflow.ai/)
- 💬 Open an issue on GitHub

## License

MIT - See LICENSE file for details

---

**Built with ❤️ using the StableFlow AI SDK**

