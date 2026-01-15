// LayerZero chain configuration
// blockTime: Average block time in seconds, fetched from https://chainspect.app/
// chainKey: LayerZero chain identifier for querying default configurations
// confirmations: Default block confirmations for source chain, fetched from https://layerzeroscan.com/tools/defaults (Send Confirmations)
// DVN count: USDT0 uses 2 DVNs (fixed value)
export const USDT0_CONFIG: Record<string, any> = {
  Ethereum: {
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    oft: "0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee",
    oftLegacy: "0x1f748c76de468e9d11bd340fa9d5cbadf315dfb0",
    eid: 30101,
    chainKey: "ethereum",
    blockTime: 12, // Ethereum average block time ~12 seconds
    confirmations: 15, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
  },
  Arbitrum: {
    contractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    oft: "0x14E4A1B13bf7F943c8ff7C51fb60FA964A298D92",
    oftLegacy: "0x77652d5aba086137b595875263fc200182919b92",
    oftMultiHopComposer: "0x759BA420bF1ded1765F18C2DC3Fc57A1964A2Ad1",
    eid: 30110,
    chainKey: "arbitrum",
    blockTime: 0.25, // Arbitrum average block time ~0.25 seconds
    confirmations: 20, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
  },
  Polygon: {
    contractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    oft: "0x6BA10300f0DC58B7a1e4c0e41f5daBb7D7829e13",
    eid: 30109,
    chainKey: "polygon",
    blockTime: 2, // Polygon average block time ~2 seconds
    confirmations: 20, // Default confirmations from layerzeroscan.com 
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
  },
  Optimism: {
    contractAddress: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071",
    oft: "0xF03b4d9AC1D5d1E7c4cEf54C2A313b9fe051A0aD",
    eid: 30111,
    chainKey: "optimism",
    blockTime: 2, // Optimism average block time ~2 seconds
    confirmations: 20, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
  },
  Berachain: {
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    oft: "0x3Dc96399109df5ceb2C226664A086140bD0379cB",
    oftTetherTokenOFTExtension: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    eid: 30362,
    chainKey: "berachain",
    blockTime: 2, // Optimism average block time ~2 seconds
    confirmations: 20, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
  },
  Solana: {
    contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    oftLegacy: "Fuww9mfc8ntAwxPUzFia7VJFAdvLppyZwhPJoXySZXf7",
    eid: 30168,
    chainKey: "solana",
    blockTime: 0.4, // Solana average block time ~0.4 seconds
    confirmations: 32, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 200000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 500000,
  },
  Tron: {
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    oftLegacy: "TFG4wBaDQ8sHWWP1ACeSGnoNR6RRzevLPt",
    eid: 30420,
    chainKey: "tron",
    blockTime: 3, // Tron average block time ~3 seconds
    confirmations: 5, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 300000,
    lzReceiveOptionGasLegacy: 300000,
    composeOptionGas: 500000,
  },
  "X Layer": {
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    oft: "0x94bcca6bdfd6a61817ab0e960bfede4984505554",
    eid: 30274,
    chainKey: "xlayer",
    blockTime: 3, // Tron average block time ~3 seconds
    confirmations: 20, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
  },
};

export const LZ_RECEIVE_VALUE: Record<string, any> = {
  Solana: 2039280,
};

// USDT0 DVN count (fixed value)
export const USDT0_DVN_COUNT = 2;

export const USDT0_LEGACY_FEE = 0.0001; // 0.01%, 10000 usdt cost 1 usdt
export const USDT0_LEGACY_MESH_TRANSFTER_FEE = 0.0003; // 0.03% https://docs.usdt0.to/tutorial/how-to-transfer#usdt0
export const DATA_HEX_PROTOBUF_EXTRA = 3;
export const SIGNATURE_SIZE = 67;
