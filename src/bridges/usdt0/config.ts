import { usdt0Chains } from "../../wallets/config/usdt0";
import { LAYERZZERO_CHAINS, type LayerZeroChainConfig } from "../utils";

interface Usdt0Config extends LayerZeroChainConfig {
  contractAddress: string;
  oft?: string;
  oftLegacy?: string;
  oftMultiHopComposer?: string;
  oftTetherTokenOFTExtension?: string;
  confirmations: number;
  lzReceiveOptionGas: number;
  lzReceiveOptionGasLegacy: number;
  composeOptionGas?: number;
  oftApprovalRequired?: boolean;
  oftLegacyApprovalRequired?: boolean;
}

// LayerZero chain configuration
// blockTime: Average block time in seconds, fetched from https://chainspect.app/
// chainKey: LayerZero chain identifier for querying default configurations
// confirmations: Default block confirmations for source chain, fetched from https://layerzeroscan.com/tools/defaults (Send Confirmations)
// For more accurate confirmation counts, visit https://layerzeroscan.com/application/usdt0, filter by the desired source chain, and check the "confirmations" value at the bottom of the page.
// DVN count: USDT0 uses 2 DVNs (fixed value)
export const USDT0_CONFIG: Record<string, Usdt0Config> = {
  Ethereum: {
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    oft: "0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee",
    oftLegacy: "0x1f748c76de468e9d11bd340fa9d5cbadf315dfb0",
    ...LAYERZZERO_CHAINS["Ethereum"],
    confirmations: 15, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    oftApprovalRequired: true,
    oftLegacyApprovalRequired: true,
  },
  Arbitrum: {
    contractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    oft: "0x14E4A1B13bf7F943c8ff7C51fb60FA964A298D92",
    oftLegacy: "0x77652d5aba086137b595875263fc200182919b92",
    oftMultiHopComposer: "0x759BA420bF1ded1765F18C2DC3Fc57A1964A2Ad1",
    ...LAYERZZERO_CHAINS["Arbitrum"],
    confirmations: 60, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    oftApprovalRequired: false,
    oftLegacyApprovalRequired: true,
  },
  Polygon: {
    contractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    oft: "0x6BA10300f0DC58B7a1e4c0e41f5daBb7D7829e13",
    ...LAYERZZERO_CHAINS["Polygon"],
    confirmations: 32, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  Optimism: {
    contractAddress: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071",
    oft: "0xF03b4d9AC1D5d1E7c4cEf54C2A313b9fe051A0aD",
    ...LAYERZZERO_CHAINS["Optimism"],
    confirmations: 450, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  Berachain: {
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    oft: "0x3Dc96399109df5ceb2C226664A086140bD0379cB",
    oftTetherTokenOFTExtension: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    ...LAYERZZERO_CHAINS["Berachain"],
    confirmations: 60, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  Solana: {
    contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    oftLegacy: "Fuww9mfc8ntAwxPUzFia7VJFAdvLppyZwhPJoXySZXf7",
    ...LAYERZZERO_CHAINS["Solana"],
    confirmations: 128, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 200000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 500000,
    oftLegacyApprovalRequired: false,
  },
  Tron: {
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    oftLegacy: "TFG4wBaDQ8sHWWP1ACeSGnoNR6RRzevLPt",
    ...LAYERZZERO_CHAINS["Tron"],
    confirmations: 5, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 300000,
    lzReceiveOptionGasLegacy: 300000,
    composeOptionGas: 500000,
    oftLegacyApprovalRequired: true,
  },
  "X Layer": {
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    oft: "0x94bcca6bdfd6a61817ab0e960bfede4984505554",
    ...LAYERZZERO_CHAINS["X Layer"],
    confirmations: 9000, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "Ton": {
    contractAddress: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    oftLegacy: "EQAd31gAUhdO0d0NZsNb_cGl_Maa9PSuNhVLE9z8bBSjX6Gq",
    eid: 30343,
    chainKey: "ton",
    blockTime: 3,
    confirmations: 2,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftLegacyApprovalRequired: false,
  },
  "Plasma": {
    contractAddress: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
    oft: "0x02ca37966753bDdDf11216B73B16C1dE756A7CF9",
    ...LAYERZZERO_CHAINS["Plasma"],
    confirmations: 1800, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "Mantle": {
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    oft: "0xcb768e263FB1C62214E7cab4AA8d036D76dc59CC",
    ...LAYERZZERO_CHAINS["Mantle"],
    confirmations: 2000, // Default confirmations from layerzeroscan.com
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "MegaETH": {
    contractAddress: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
    oft: "0x9151434b16b9763660705744891fa906f660ecc5",
    ...LAYERZZERO_CHAINS["MegaETH"],
    confirmations: 5400,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "Ink": {
    contractAddress: "0x0200C29006150606B650577BBE7B6248F58470c1",
    oft: "0x1cB6De532588fCA4a21B7209DE7C456AF8434A65",
    ...LAYERZZERO_CHAINS["Ink"],
    confirmations: 450,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "Stable": {
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    oft: "0xedaba024be4d87974d5aB11C6Dd586963CcCB027",
    ...LAYERZZERO_CHAINS["Stable"],
    confirmations: 3600,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "Celo": {
    contractAddress: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    oftLegacy: "0xf10E161027410128E63E75D0200Fb6d34b2db243",
    ...LAYERZZERO_CHAINS["Celo"],
    confirmations: 10,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftLegacyApprovalRequired: true,
  },
  "Sei": {
    contractAddress: "0x9151434b16b9763660705744891fA906F660EcC5",
    oft: "0x56Fe74A2e3b484b921c447357203431a3485CC60",
    ...LAYERZZERO_CHAINS["Sei"],
    confirmations: 2000,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
  "Flare": {
    contractAddress: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D",
    oft: "0x567287d2A9829215a37e3B88843d32f9221E7588",
    ...LAYERZZERO_CHAINS["Flare"],
    confirmations: 500,
    lzReceiveOptionGas: 80000,
    lzReceiveOptionGasLegacy: 200000,
    composeOptionGas: 600000,
    oftApprovalRequired: false,
  },
};

export const LZ_RECEIVE_VALUE: Record<string, any> = {
  Solana: 2039280,
};

// https://docs.layerzero.network/v2/developers/evm/tooling/layerzeroscan#transaction-statuses
// https://scan.layerzero-api.com/v1/swagger
export const LzScanStatus = {
  // The message has been successfully sent and received by the destination chain.
  Delivered: "DELIVERED",
  // The message is currently being transmitted between chains and has not yet reached its destination.
  InFlight: "INFLIGHT",
  // The message arrived at the destination, but reverted or ran out of gas during execution and needs to be retried.
  PayloadStored: "PAYLOAD_STORED",
  // The transaction encountered an error and did not complete.
  Failed: "FAILED",
  // A previous message nonce has a stored payload, halting the current transaction.
  Blocked: "BLOCKED",
  // The system is validating the finality of a transaction amidst potential high gas replacements or block reorgs.
  Confirming: "CONFIRMING",
  ApplicationBurned: "APPLICATION_BURNED",
  ApplicationSkipped: "APPLICATION_SKIPPED",
  UnresolvableCommand: "UNRESOLVABLE_COMMAND",
  MalformedCommand: "MALFORMED_COMMAND",
};

export type LzScanStatus = (typeof LzScanStatus)[keyof typeof LzScanStatus];

export const LzScanSourceStatus = {
  Waiting: "WAITING",
  ValidatingTx: "VALIDATING_TX",
  Succeeded: "SUCCEEDED",
  WaitingForHashDelivered: "WAITING_FOR_HASH_DELIVERED",
  UnresolvableCommand: "UNRESOLVABLE_COMMAND",
  MalformedCommand: "MALFORMED_COMMAND",
};
export type LzScanSourceStatus = (typeof LzScanSourceStatus)[keyof typeof LzScanSourceStatus];

export const LzScanDestinationStatus = {
  Waiting: "WAITING",
  ValidatingTx: "VALIDATING_TX",
  Succeeded: "SUCCEEDED",
  PayloadStored: "PAYLOAD_STORED",
};
export type LzScanDestinationStatus = (typeof LzScanDestinationStatus)[keyof typeof LzScanDestinationStatus];

export const LzScanLzComposeStatus = {
  Waiting: "WAITING",
  ValidatingTx: "VALIDATING_TX",
  Succeeded: "SUCCEEDED",
  NA: "N/A",
  Failed: "FAILED",
  SimulatedReverted: "SIMULATION_REVERTED",
  WaitingForComposeSentEvent: "WAITING_FOR_COMPOSE_SENT_EVENT",
};
export type LzScanLzComposeStatus = (typeof LzScanLzComposeStatus)[keyof typeof LzScanLzComposeStatus];

// USDT0 DVN count (fixed value)
export const USDT0_DVN_COUNT = 2;

export const USDT0_LEGACY_FEE = 0.0001; // 0.01%, 10000 usdt cost 1 usdt
export const USDT0_LEGACY_MESH_TRANSFTER_FEE = 0.0003; // 0.03% https://docs.usdt0.to/tutorial/how-to-transfer#usdt0
export const DATA_HEX_PROTOBUF_EXTRA = 3;
export const SIGNATURE_SIZE = 67;

export const MIDDLE_CHAIN_REFOUND_ADDRESS = "0x654E7B96E1DE0b54E53D9ae8082fC2219E66dAC3";
export const MIDDLE_TOKEN_CHAIN = usdt0Chains["arb"];
export const MIDDLE_CHAIN_LAYERZERO_EXECUTOR = "0x53812Feae0fd2C43f8E6D8847A7f5d035F1d1f8f";

