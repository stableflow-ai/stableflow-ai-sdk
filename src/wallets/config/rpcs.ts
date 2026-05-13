export const NetworkRpcUrlsMap: Record<string, string[]> = {
  "eth": ["https://eth.merkle.io"],
  "arb": ["https://arb1.arbitrum.io/rpc"],
  "bsc": ["https://56.rpc.thirdweb.com"],
  "avax": ["https://api.avax.network/ext/bc/C/rpc"],
  "base": ["https://mainnet.base.org"],
  "pol": ["https://polygon-rpc.com"],
  "gnosis": ["https://rpc.gnosischain.com"],
  "op": ["https://mainnet.optimism.io"],
  "bera": ["https://rpc.berachain.com"],
  "tron": ["https://api.trongrid.io"],
  "aptos": ["https://api.mainnet.aptoslabs.com/v1"],
  "sol": ["https://solana-rpc.publicnode.com"],
  "near": ["https://nearinner.deltarpc.com"],
  "xlayer": ["https://rpc.xlayer.tech"],
  "plasma": ["https://rpc.plasma.to"],
  "mantle": ["https://rpc.mantle.xyz", "https://mantle-rpc.publicnode.com"],
  "megaeth": ["https://mainnet.megaeth.com/rpc"],
  "ink": ["https://rpc-gel.inkonchain.com", "https://rpc-qnd.inkonchain.com"],
  "stable": ["https://rpc.stable.xyz"],
  "celo": ["https://forno.celo.org"],
  "sei": ["https://sei-evm-rpc.publicnode.com"],
  "flare": ["https://flare-api.flare.network/ext/C/rpc"],
  "frax": ["https://rpc.frax.com"],
  "ton": ["https://toncenter.com/api/v2/jsonRPC"],
  "sui": ["https://fullnode.mainnet.sui.io:443"],
  "katana": ["https://rpc.katana.network", "https://katana.drpc.org"],
};

/**
 * @deprecated Please use getChainRpcUrl instead
 * @param blockchain 
 * @returns 
 */
export const getRpcUrls = (blockchain: string): string[] => {
  return NetworkRpcUrlsMap[blockchain] || [];
};

export const getChainRpcUrl = (blockchain: string): { rpcUrls: string[]; rpcUrl: string; } => {
  return {
    rpcUrls: NetworkRpcUrlsMap[blockchain],
    rpcUrl: NetworkRpcUrlsMap[blockchain][0],
  };
};

export const setRpcUrls = (urls: Record<string, string[]>) => {
  for (const blockchain in urls) {
    const prev = NetworkRpcUrlsMap[blockchain] ?? [];
    const next = urls[blockchain];
    for (let i = next.length - 1; i >= 0; i--) {
      const rpc = next[i];
      if (prev.some((_rpc) => _rpc.toLowerCase() === rpc.toLowerCase())) {
        continue;
      }
      prev.unshift(rpc);
    }
  }
  return NetworkRpcUrlsMap;
};
