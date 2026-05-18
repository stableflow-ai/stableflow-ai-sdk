import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@stableflow/bridges',
    '@stableflow/core',
    '@stableflow/utils-evm',
    '@stableflow/utils-solana',
    '@stableflow/hyperliquid',
    '@stableflow/wallet-aptos',
    '@stableflow/wallet-evm',
    '@stableflow/wallet-near',
    '@stableflow/wallet-solana',
    '@stableflow/wallet-sui',
    '@stableflow/wallet-ton',
    '@stableflow/wallet-tron',
  ],
});
