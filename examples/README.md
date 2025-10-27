# StableFlow AI SDK Examples

This directory contains usage examples for the StableFlow AI SDK.

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

### basic-swap-flow.ts

Demonstrates the complete token swap flow:

1. Get list of supported tokens
2. Request a swap quote
3. Submit deposit transaction
4. Check execution status
5. JWT Token refresh handling

## Notes

- The example uses `dry: true` mode for testing and won't generate real deposit addresses
- Make sure you understand each parameter before using in production

