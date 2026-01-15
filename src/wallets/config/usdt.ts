import { Service } from "../../core/Service";
import { TokenConfig } from "../../models/Token";
import chains from "./chains";

export const usdt = {
  symbol: "USDT",
  decimals: 6,
  icon: "/usdt.png"
};

export const usdtChains: Record<string, TokenConfig> = {
  eth: {
    ...usdt,
    assetId: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    ...chains.eth,
    services: [Service.OneClick, Service.Usdt0],
  },
  arb: {
    ...usdt,
    assetId: "nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
    contractAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    ...chains.arb,
    services: [Service.OneClick, Service.Usdt0],
  },
  pol: {
    ...usdt,
    assetId: "nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr",
    contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    ...chains.pol,
    services: [Service.OneClick, Service.Usdt0],
  },
  bsc: {
    ...usdt,
    decimals: 18,
    assetId: "nep245:v2_1.omni.hot.tg:56_2CMMyVTGZkeyNZTSvS5sarzfir6g",
    contractAddress: "0x55d398326f99059ff775485246999027b3197955",
    ...chains.bsc,
    services: [Service.OneClick],
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
    services: [Service.OneClick],
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
  bera: {
    ...usdt,
    assetId: "nep141:bera-0x779ded0c9e1022225f8e0630b35a9b54be713736.omft.near",
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    ...chains.bera,
    services: [Service.OneClick, Service.Usdt0],
  },
  xlayer: {
    ...usdt,
    assetId: "nep245:v2_1.omni.hot.tg:196_2fezDCvVYRsG8wrK6deJ2VRPiAS1",
    contractAddress: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
    ...chains.xlayer,
    services: [Service.OneClick, Service.Usdt0],
  },
};
