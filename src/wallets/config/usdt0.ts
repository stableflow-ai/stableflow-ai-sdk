import { Service } from "../../core/Service";
import { TokenConfig } from "../../models/Token";
import chains from "./chains";

export const usdt0 = {
  symbol: "USD₮0",
  decimals: 6,
  icon: "/usdt0.png",
  name: "USD₮0",
};

export const usdt0Chains: Record<string, TokenConfig> = {
  // eth: {
  //   ...usdt0,
  //   symbol: "USDT",
  //   icon: "/usdt.png",
  //   assetId: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near",
  //   contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  //   ...chains.eth,
  //   services: [Service.OneClick, Service.Usdt0, Service.Native],
  // },
  arb: {
    ...usdt0,
    assetId: "nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
    contractAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    ...chains.arb,
    services: [Service.OneClick, Service.Usdt0, Service.Native],
  },
  pol: {
    ...usdt0,
    assetId: "nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr",
    contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    ...chains.pol,
    services: [Service.OneClick, Service.Usdt0],
  },
  op: {
    ...usdt0,
    assetId: "",
    contractAddress: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071",
    ...chains.op,
    services: [Service.Usdt0],
  },
  bera: {
    ...usdt0,
    assetId: "nep141:bera-0x779ded0c9e1022225f8e0630b35a9b54be713736.omft.near",
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    ...chains.bera,
    services: [Service.OneClick, Service.Usdt0],
  },
  xlayer: {
    ...usdt0,
    assetId: "nep245:v2_1.omni.hot.tg:196_2fezDCvVYRsG8wrK6deJ2VRPiAS1",
    contractAddress: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
    ...chains.xlayer,
    services: [Service.OneClick, Service.Usdt0],
  },
  plasma: {
    ...usdt0,
    assetId: "nep245:v2_1.omni.hot.tg:9745_3aL9skCy1yhPoDB8oKMmRHRN7SJW",
    contractAddress: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
    ...chains.plasma,
    services: [Service.OneClick, Service.Usdt0],
  },
  mantle: {
    ...usdt0,
    assetId: "",
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    ...chains.mantle,
    services: [Service.Usdt0],
  },
  megaeth: {
    ...usdt0,
    assetId: "",
    contractAddress: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
    ...chains.megaeth,
    services: [Service.Usdt0],
  },
  ink: {
    ...usdt0,
    assetId: "",
    contractAddress: "0x0200C29006150606B650577BBE7B6248F58470c1",
    ...chains.ink,
    services: [Service.Usdt0],
  },
  stable: {
    ...usdt0,
    assetId: "",
    contractAddress: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    ...chains.stable,
    services: [Service.Usdt0],
  },
  celo: {
    ...usdt0,
    assetId: "",
    contractAddress: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    ...chains.celo,
    services: [Service.Usdt0],
  },
  sei: {
    ...usdt0,
    assetId: "",
    contractAddress: "0x9151434b16b9763660705744891fA906F660EcC5",
    ...chains.sei,
    services: [Service.Usdt0],
  },
  flare: {
    ...usdt0,
    assetId: "",
    contractAddress: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D",
    ...chains.flare,
    services: [Service.Usdt0],
  },
};

export const usdt0Evm = {
  ...usdt0,
  chains: Object.values(usdt0Chains).filter((chain) => chain.chainType === "evm")
};
