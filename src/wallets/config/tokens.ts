import { usdtChains } from "./usdt";
import { usdcChains } from "./usdc";
import { TokenConfig } from "../../models/Token";

export const tokens: TokenConfig[] = [
  ...Object.values(usdtChains),
  ...Object.values(usdcChains),
];

export const usdtTokens: TokenConfig[] = Object.values(usdtChains);
export const usdcTokens: TokenConfig[] = Object.values(usdcChains);
