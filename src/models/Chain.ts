export interface ChainConfig {
  chainName: string;
  chainId?: number;
  /**
   * SDA.getTokens() blockchain
   */
  blockchain: string;
  chainIcon: string;
  chainIconGray: string;
  chainType: string;
  blockExplorerUrl: string;
  blockExplorerUrls: string[];
  primaryColor: string;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  rpcUrl: string;
}
