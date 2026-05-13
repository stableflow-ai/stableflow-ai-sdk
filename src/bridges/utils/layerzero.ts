export interface LayerZeroChainConfig {
  eid: number;
  chainKey: string;
  blockTime: number;
}

// LayerZero chain configuration
// blockTime: Average block time in seconds, fetched from https://chainspect.app/
export const LAYERZZERO_CHAINS: Record<string, LayerZeroChainConfig> = {
  "Ethereum": {
    eid: 30101,
    chainKey: "ethereum",
    blockTime: 12,
  },
  Arbitrum: {
    eid: 30110,
    chainKey: "arbitrum",
    blockTime: 0.25,
  },
  Avalanche: {
    eid: 30106,
    chainKey: "avax",
    blockTime: 1.2,
  },
  Polygon: {
    eid: 30109,
    chainKey: "polygon",
    blockTime: 2,
  },
  Optimism: {
    eid: 30111,
    chainKey: "optimism",
    blockTime: 2,
  },
  Berachain: {
    eid: 30362,
    chainKey: "berachain",
    blockTime: 2,
  },
  Solana: {
    eid: 30168,
    chainKey: "solana",
    blockTime: 0.4,
  },
  Tron: {
    eid: 30420,
    chainKey: "tron",
    blockTime: 3,
  },
  "X Layer": {
    eid: 30274,
    chainKey: "xlayer",
    blockTime: 0.5,
  },
  "Plasma": {
    eid: 30383,
    chainKey: "plasma",
    blockTime: 1,
  },
  "Mantle": {
    eid: 30181,
    chainKey: "mantle",
    blockTime: 2,
  },
  "MegaETH": {
    eid: 30398,
    chainKey: "megaeth",
    blockTime: 1,
  },
  "Ink": {
    eid: 30339,
    chainKey: "ink",
    blockTime: 1,
  },
  "Stable": {
    eid: 30396,
    chainKey: "stable",
    blockTime: 0.7,
  },
  "Celo": {
    eid: 30125,
    chainKey: "celo",
    blockTime: 1,
  },
  "Sei": {
    eid: 30280,
    chainKey: "sei",
    blockTime: 2,
  },
  "Flare": {
    eid: 30295,
    chainKey: "flare",
    blockTime: 1.8,
  },
  "BNB Chain": {
    eid: 30102,
    chainKey: "bsc",
    blockTime: 0.45,
  },
  Fraxtal: {
    eid: 30255,
    chainKey: "frax",
    blockTime: 2,
  },
  Ton: {
    eid: 30343,
    chainKey: "ton",
    blockTime: 2.71,
  },
};

/**
 * Calculates cross-chain estimated time using the LayerZero formula.
 * Formula: Total Time ≈ (sourceBlockTime × blockConfirmations) + (destinationBlockTime × (2 blocks + DVN count))
 *
 * @param params - Object containing configuration and DVN details.
 * @param params.requiredDvnCount - The number of DVNs for this bridge (typically fixed per application, e.g., 2 or 3)
 * @param params.originConfig - Source chain configuration; should include blockTime (number) and confirmations (number)
 * @param params.destinationConfig - Destination chain configuration; should include blockTime (number)
 * @returns Estimated time in seconds. Returns 32 if configuration is missing or invalid.
 */
export function calculateEstimateTime(params: {
  requiredDvnCount: number;
  originConfig: { blockTime: number; confirmations: number; };
  destinationConfig: { blockTime: number; confirmations: number; };
}): number {
  const {
    requiredDvnCount,
    originConfig,
    destinationConfig,
  } = params;

  // Return default value if config is missing
  if (!originConfig || !destinationConfig) {
    return 32;
  }

  // Validate required configuration fields
  if (
    typeof originConfig.blockTime !== 'number' ||
    typeof originConfig.confirmations !== 'number' ||
    typeof destinationConfig.blockTime !== 'number'
  ) {
    return 32;
  }

  const sourceBlockTime = originConfig.blockTime;
  const blockConfirmations = originConfig.confirmations;
  const destinationBlockTime = destinationConfig.blockTime;
  const dvnCount = requiredDvnCount;

  // Calculate: source chain part + destination chain part
  const sourceTime = sourceBlockTime * blockConfirmations;
  const destinationTime = destinationBlockTime * (2 + dvnCount);
  const totalTime = Math.ceil(sourceTime + destinationTime);

  return totalTime;
}
