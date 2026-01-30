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
};

export const getRpcUrls = (blockchain: string): string[] => {
  return NetworkRpcUrlsMap[blockchain] || [];
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
