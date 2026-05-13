import { Service } from "../../core/Service";
import { TokenConfig } from "../../models/Token";
import chains from "./chains";

export const usdc = {
  symbol: "USDC",
  decimals: 6,
  icon: "/usdc.png",
  name: "USD Coin",
};

export const usdcChains: Record<string, TokenConfig> = {
  eth: {
    ...usdc,
    assetId: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    ...chains.eth,
    services: [Service.OneClick, Service.CCTP, Service.Native],
  },
  arb: {
    ...usdc,
    assetId: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near",
    contractAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    ...chains.arb,
    services: [Service.OneClick, Service.CCTP, Service.Native],
  },
  base: {
    ...usdc,
    assetId: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
    contractAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    ...chains.base,
    services: [Service.OneClick, Service.CCTP, Service.Native],
  },
  // gnosis: {
  //   ...usdc,
  //   assetId:
  //     "nep141:gnosis-0x2a22f9c3b484c3629090feed35f17ff8f88f76f0.omft.near",
  //   contractAddress: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
  //   ...chains.gnosis,
  //   services: [Service.OneClick],
  // },
  pol: {
    ...usdc,
    assetId: "nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L",
    contractAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    ...chains.pol,
    services: [Service.OneClick, Service.CCTP],
  },
  bsc: {
    ...usdc,
    assetId: "nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r",
    contractAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    ...chains.bsc,
    decimals: 18,
    services: [Service.OneClick, Service.Native],
  },
  op: {
    ...usdc,
    assetId: "nep245:v2_1.omni.hot.tg:10_A2ewyUyDp6qsue1jqZsGypkCxRJ",
    contractAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    ...chains.op,
    services: [Service.OneClick, Service.CCTP],
  },
  avax: {
    ...usdc,
    assetId: "nep245:v2_1.omni.hot.tg:43114_3atVJH3r5c4GqiSYmg9fECvjc47o",
    contractAddress: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    ...chains.avax,
    services: [Service.OneClick, Service.CCTP],
  },
  near: {
    ...usdc,
    assetId:
      "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    contractAddress:
      "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    ...chains.near,
    services: [Service.OneClick],
  },
  sol: {
    ...usdc,
    assetId: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near",
    contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    ...chains.sol,
    services: [Service.OneClick, Service.CCTP],
  },
  xlayer: {
    ...usdc,
    assetId: "nep245:v2_1.omni.hot.tg:196_2dK9kLNR7Ekq7su8FxNGiUW3djTw",
    contractAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
    ...chains.xlayer,
    services: [Service.OneClick],
  },
  aptos: {
    ...usdc,
    assetId: "nep141:aptos-34ee497f210c5a511e8d5b53bc56d75b63612bb5.omft.near",
    contractAddress: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
    ...chains.aptos,
    services: [Service.OneClick],
  },
};

export const usdcSol = {
  ...usdc,
  ...usdcChains.sol,
  chains: [usdcChains.sol],
};

export const usdcNear = {
  ...usdc,
  ...usdcChains.near,
  chains: [usdcChains.near],
};

export const usdcAptos = {
  ...usdc,
  ...usdcChains.aptos,
  chains: [usdcChains.aptos],
};

export const usdcEvm = {
  ...usdc,
  chains: Object.values(usdcChains).filter((chain) => chain.chainType === "evm")
};
