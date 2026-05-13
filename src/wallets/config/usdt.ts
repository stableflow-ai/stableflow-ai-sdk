import { Service } from "../../core/Service";
import { TokenConfig } from "../../models/Token";
import chains from "./chains";

export const usdt = {
  symbol: "USDT",
  decimals: 6,
  icon: "/usdt.png",
  name: "Tether USD",
};

export const usdtChains: Record<string, TokenConfig> = {
  eth: {
    ...usdt,
    assetId: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    ...chains.eth,
    services: [Service.OneClick, Service.Usdt0, Service.Native],
  },
  bsc: {
    ...usdt,
    assetId: "nep245:v2_1.omni.hot.tg:56_2CMMyVTGZkeyNZTSvS5sarzfir6g",
    contractAddress: "0x55d398326f99059ff775485246999027b3197955",
    ...chains.bsc,
    decimals: 18,
    services: [Service.OneClick, Service.Native],
  },
  op: {
    ...usdt,
    assetId: "nep245:v2_1.omni.hot.tg:10_359RPSJVdTxwTJT9TyGssr2rFoWo",
    contractAddress: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    ...chains.op,
    services: [Service.OneClick],
  },
  avax: {
    ...usdt,
    assetId: "nep245:v2_1.omni.hot.tg:43114_372BeH7ENZieCaabwkbWkBiTTgXp",
    contractAddress: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
    ...chains.avax,
    services: [Service.OneClick],
  },
  // disabled gnosis temporarily, 22/Oct/2025
  // gnosis: {
  //   ...usdt,
  //   assetId: "nep141:gnosis-0x4ecaba5870353805a9f068101a40e0f32ed605c6.omft.near",
  //   contractAddress: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
  //   ...chains.gnosis,
  //   services: [Service.OneClick],
  // },
  near: {
    ...usdt,
    assetId: "nep141:usdt.tether-token.near",
    contractAddress: "usdt.tether-token.near",
    ...chains.near,
    services: [Service.OneClick],
  },
  sol: {
    ...usdt,
    assetId: "nep141:sol-c800a4bd850783ccb82c2b2c7e84175443606352.omft.near",
    contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    ...chains.sol,
    services: [Service.OneClick, Service.Usdt0],
  },
  tron: {
    ...usdt,
    assetId: "nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    ...chains.tron,
    services: [Service.OneClick, Service.Usdt0],
  },
  aptos: {
    ...usdt,
    assetId: "nep141:aptos-88cb7619440a914fe6400149a12b443c3ac21d59.omft.near",
    contractAddress: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
    ...chains.aptos,
    services: [Service.OneClick],
  },
  ton: {
    ...usdt,
    assetId: "nep245:v2_1.omni.hot.tg:1117_3tsdfyziyc7EJbP2aULWSKU4toBaAcN4FdTgfm5W1mC4ouR",
    contractAddress: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    ...chains.ton,
    services: [Service.OneClick, Service.Usdt0],
  },
};

export const usdtSol = {
  ...usdt,
  ...usdtChains.sol,
  chains: [usdtChains.sol],
};

export const usdtNear = {
  ...usdt,
  ...usdtChains.near,
  chains: [usdtChains.near],
};

export const usdtEvm = {
  ...usdt,
  chains: Object.values(usdtChains).filter((chain) => chain.chainType === "evm")
};

export const usdtTron = {
  ...usdt,
  ...usdtChains.tron,
  chains: [usdtChains.tron],
};

export const usdtAptos = {
  ...usdt,
  ...usdtChains.aptos,
  chains: [usdtChains.aptos],
};

export const usdtTon = {
  ...usdt,
  ...usdtChains.ton,
  chains: [usdtChains.ton],
};
