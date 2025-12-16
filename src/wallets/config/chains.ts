import { ChainConfig } from "../../models/Chain";
import { chainsRpcUrls } from "./rpcs";

export type ChainType = "near" | "sol" | "evm" | "tron" | "aptos";

export const chainTypes: Record<ChainType, { value: ChainType; name: string; color: string; }> = {
  near: {
    value: "near",
    name: "Near",
    color: "#56DEAD",
  },
  sol: {
    value: "sol",
    name: "Solana",
    color: "#987FF3",
  },
  evm: {
    value: "evm",
    name: "EVM",
    color: "#C4CAE1",
  },
  tron: {
    value: "tron",
    name: "Tron",
    color: "#F66273",
  },
  aptos: {
    value: "aptos",
    name: "Aptos",
    color: "#000000",
  },
};

const chains: Record<string, ChainConfig> = {
  near: {
    chainName: "Near",
    chainIcon: "/chains/near.png",
    chainIconGray: "/chains/near-gray.png",
    chainType: chainTypes.near.value,
    blockExplorerUrl: "https://nearblocks.io/txns",
    primaryColor: "#76EA9E",
    nativeToken: {
      symbol: "NEAR",
      decimals: 24,
    },
    rpcUrl: chainsRpcUrls["Near"],
  },
  sol: {
    chainName: "Solana",
    chainIcon: "/chains/solana.png",
    chainIconGray: "/chains/solana-gray.png",
    chainType: chainTypes.sol.value,
    blockExplorerUrl: "https://solscan.io/tx",
    primaryColor: "#B93EF0",
    nativeToken: {
      symbol: "SOL",
      decimals: 9,
    },
    rpcUrl: chainsRpcUrls["Solana"],
  },
  eth: {
    chainName: "Ethereum",
    chainIcon: "/chains/ethereum.png",
    chainIconGray: "/chains/ethereum-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 1,
    blockExplorerUrl: "https://etherscan.io/tx",
    primaryColor: "#7083ee",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Ethereum"],
  },
  arb: {
    chainName: "Arbitrum",
    chainIcon: "/chains/arbitrum.png",
    chainIconGray: "/chains/arbitrum-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 42161,
    blockExplorerUrl: "https://arbiscan.io/tx",
    primaryColor: "#4763A7",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Arbitrum"],
  },
  bsc: {
    chainName: "BNB Chain",
    chainIcon: "/chains/bsc.png",
    chainIconGray: "/chains/bsc-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 56,
    blockExplorerUrl: "https://bscscan.com/tx",
    primaryColor: "#F1C144",
    nativeToken: {
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["BNB Chain"],
  },
  avax: {
    chainName: "Avalanche",
    chainIcon: "/chains/avalanche.png",
    chainIconGray: "/chains/avalanche-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 43114,
    blockExplorerUrl: "https://snowtrace.io/tx",
    primaryColor: "#9D2620",
    nativeToken: {
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Avalanche"],
  },
  base: {
    chainName: "Base",
    chainIcon: "/chains/base.png",
    chainIconGray: "/chains/base-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 8453,
    blockExplorerUrl: "https://basescan.org/tx",
    primaryColor: "#3137F6",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Base"],
  },
  pol: {
    chainName: "Polygon",
    chainIcon: "/chains/polygon.png",
    chainIconGray: "/chains/polygon-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 137,
    blockExplorerUrl: "https://polygonscan.com/tx",
    primaryColor: "#5A2AD1",
    nativeToken: {
      symbol: "POL",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Polygon"],
  },
  gnosis: {
    chainName: "Gnosis",
    chainIcon: "/chains/gnosis.png",
    chainIconGray: "/chains/gnosis-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 100,
    blockExplorerUrl: "https://gnosisscan.io/tx",
    primaryColor: "#285230",
    nativeToken: {
      symbol: "XDAI",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Gnosis"],
  },
  op: {
    chainName: "Optimism",
    chainIcon: "/chains/optimism.png",
    chainIconGray: "/chains/optimism-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 10,
    blockExplorerUrl: "https://optimistic.etherscan.io/tx",
    primaryColor: "#B5271D",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Optimism"],
  },
  tron: {
    chainName: "Tron",
    chainIcon: "/chains/tron.png",
    chainIconGray: "/chains/tron-gray.png",
    chainType: chainTypes.tron.value,
    blockExplorerUrl: "https://tronscan.org/tx",
    primaryColor: "#BC3221",
    nativeToken: {
      symbol: "TRX",
      decimals: 6,
    },
    rpcUrl: chainsRpcUrls["Tron"],
  },
  aptos: {
    chainName: "Aptos",
    chainIcon: "/chains/aptos.png",
    chainIconGray: "/chains/aptos-gray.png",
    chainType: chainTypes.aptos.value,
    blockExplorerUrl: "https://aptoscan.com/transaction",
    primaryColor: "#000000",
    nativeToken: {
      symbol: "APT",
      decimals: 8,
    },
    rpcUrl: chainsRpcUrls["Aptos"],
  },
  bera: {
    chainName: "Berachain",
    chainIcon: "/chains/berachain.png",
    chainIconGray: "/chains/berachain-gray.png",
    chainType: chainTypes.evm.value,
    chainId: 80094,
    blockExplorerUrl: "https://berascan.com/tx/",
    primaryColor: "#F37325",
    nativeToken: {
      symbol: "BERA",
      decimals: 18,
    },
    rpcUrl: chainsRpcUrls["Berachain"],
  },
};

export default chains;
