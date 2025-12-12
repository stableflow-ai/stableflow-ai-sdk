import { ServiceType } from "../core/Service";
import { ChainConfig } from "./Chain";

export interface TokenConfig extends ChainConfig {
  symbol: string;
  decimals: number;
  icon: string;
  assetId: string;
  contractAddress: string;
  services: ServiceType[];
}
