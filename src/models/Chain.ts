import { ChainType } from "../wallets/config/chains";

export interface ChainConfig {
  chainName: string;
  blockchain: string;
  chainIcon: string;
  chainIconGray: string;
  chainType: ChainType;
  chainId?: number;
  blockExplorerUrl: string;
  primaryColor: string;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
}
