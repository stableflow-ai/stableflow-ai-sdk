import { frxusdChains } from "../../wallets/config/frxusd";
import { usdcChains } from "../../wallets/config/usdc";
import { LayerZeroChainConfig, LAYERZZERO_CHAINS } from "../utils";

export interface FraxZeroConfig extends LayerZeroChainConfig {
  remoteHop?: string;
  lockbox?: string;
  programId?: string;
  mint?: string;
  escrow?: string;
  confirmations: number;
  oftApprovalRequired?: boolean;
  oftLegacyApprovalRequired?: boolean;
}

// DVN count: frax-finance uses 3 DVNs (fixed value)
export const FRAXZERO_REQUIRED_DVN_COUNT = 3;

// FraxZero RemoteHop config, see https://docs.frax.com/frxusd/fraxzero-supported-networks
// Chain names match chainName in frxusdChains, excluding Fraxtal
// confirmation counts: visit https://layerzeroscan.com/application/frax-finance, filter by the desired source chain, and check the "confirmations" value at the bottom of the page.
export const FRAXZERO_CONFIG: Record<string, FraxZeroConfig> = {
  Ethereum: {
    ...LAYERZZERO_CHAINS["Ethereum"],
    remoteHop: "0x3ad4dC2319394bB4BE99A0e4aE2AbF7bCEbD648E",
    lockbox: "0x566a6442a5a6e9895b9dca97cc7879d632c6e4b0",
    confirmations: 15,
    oftApprovalRequired: true,
  },
  Arbitrum: {
    ...LAYERZZERO_CHAINS["Arbitrum"],
    remoteHop: "0x29F5DBD0FE72d8f11271FCBE79Cb87E18a83C70A",
    confirmations: 20,
    oftApprovalRequired: true,
  },
  Avalanche: {
    ...LAYERZZERO_CHAINS["Avalanche"],
    remoteHop: "0x7a07D606c87b7251c2953A30Fa445d8c5F856C7A",
    confirmations: 12,
    oftApprovalRequired: true,
  },
  Berachain: {
    ...LAYERZZERO_CHAINS["Berachain"],
    remoteHop: "0xc71BF5Ee4740405030eF521F18A96eA14fec802D",
    confirmations: 20,
    oftApprovalRequired: true,
  },
  "BNB Chain": {
    ...LAYERZZERO_CHAINS["BNB Chain"],
    remoteHop: "0x452420df4AC1e3db5429b5FD629f3047482C543C",
    confirmations: 20,
    oftApprovalRequired: true,
  },
  Optimism: {
    ...LAYERZZERO_CHAINS["Optimism"],
    remoteHop: "0x31D982ebd82Ad900358984bd049207A4c2468640",
    confirmations: 20,
    oftApprovalRequired: true,
  },
  Polygon: {
    ...LAYERZZERO_CHAINS["Polygon"],
    remoteHop: "0xf74D38A26948E9DDa53eD85cF03C6b1188FbB30C",
    confirmations: 512,
    oftApprovalRequired: true,
  },
  "X Layer": {
    ...LAYERZZERO_CHAINS["X Layer"],
    remoteHop: "0x79152c303AD5aE429eDefa4553CB1Ad2c6EE1396",
    confirmations: 225000,
    oftApprovalRequired: true,
  },
  Solana: {
    ...LAYERZZERO_CHAINS["Solana"],
    programId: "E1ht9dUh1ZkgWWRRPCuN3kExEoF2FXiyADXeN3XyMHaQ",
    escrow: "84AFSH3TSzyjbEFJX9z8sjpV7npTWq7f8ZR5zkLG22hX",
    confirmations: 32,
    oftApprovalRequired: false,
  },
  Fraxtal: {
    ...LAYERZZERO_CHAINS["Fraxtal"],
    lockbox: "0x96A394058E2b84A89bac9667B19661Ed003cF5D4",
    confirmations: 5,
    oftApprovalRequired: true,
  },
};

export const FRAXZERO_MIDDLE_TOKEN_USDC = usdcChains["eth"];
export const FRAXZERO_MIDDLE_TOKEN_FRXUSD = frxusdChains["eth"];
export const FRAXZERO_MIDDLE_CHAIN_REFOUND_ADDRESS = "0x654E7B96E1DE0b54E53D9ae8082fC2219E66dAC3";

export const FRAXZERO_REDEEM_USDC_CONTRACT = "0x4F95C5bA0C7c69FB2f9340E190cCeE890B3bd87c";
export const FRAXZERO_REDEEM_RWA_CONTRACT = "0x5fbAa3A3B489199338fbD85F7E3D444dc0504F33";
export const FRAXZERO_REDEMPTION_CONTRACT = "0x4c21B7577C8FE8b0B0669165ee7C8f67fa1454Cf";

export const FRAXZERO_REDEEM_AND_MINT_CONTRACT = "0x4b7fe4ac08c5f1e88231d35a382f6d70cf55cbb5";

// gas amount = gas limit * gas price
export const FRAXZERO_GAS_USED = {
  REDEEM: 358964n,
  MINT: {
    TO_SOL: 756271n,
    TO_FRAXTAL: 660997n,
    TO_ETHEREUM: 334550n,
    SEND: 756271n,
  },
};
