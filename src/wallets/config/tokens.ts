import { usdtChains } from "./usdt";
import { usdt0Chains } from "./usdt0";
import { usdcChains } from "./usdc";
import { frxusdChains } from "./frxusd";
import { TokenConfig } from "../../models/Token";

export const tokens: TokenConfig[] = [
  ...Object.values(usdtChains),
  ...Object.values(usdcChains),
  ...Object.values(usdt0Chains),
  ...Object.values(frxusdChains),
];

export const usdtTokens: TokenConfig[] = [...Object.values(usdtChains), ...Object.values(usdt0Chains)];
export const usdcTokens: TokenConfig[] = Object.values(usdcChains);
export const frxusdTokens: TokenConfig[] = Object.values(frxusdChains);
