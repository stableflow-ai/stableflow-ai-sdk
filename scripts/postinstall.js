#!/usr/bin/env node
'use strict';

if (process.env.STABLEFLOW_AI_SDK_SILENCE_DEPRECATION === '1') {
  process.exit(0);
}

const MIGRATION_GUIDE =
  'https://github.com/stableflow-ai/stableflow-sdk/blob/main/DEVELOPER_GUIDE.md#12-migration-guide';

const border = '='.repeat(62);

console.warn(`
${border}
  WARNING: stableflow-ai-sdk is deprecated and no longer maintained

  Please migrate to @stableflow/* packages:
    - @stableflow/core        - API, SFA, token config
    - @stableflow/bridges     - BridgeSFA, cross-chain bridge flows
    - @stableflow/wallet-*    - per-chain wallet adapters
    - @stableflow/hyperliquid - Hyperliquid deposits

  Migration guide: ${MIGRATION_GUIDE}
${border}
`);
