import { Service } from "../../core/Service";
import { TokenConfig } from "../../models/Token";
import chains from "./chains";

export const frxusd = {
  symbol: "frxUSD",
  decimals: 18,
  icon: "/frxusd.png",
  name: "Frax USD",
};

// https://docs.frax.com/frxusd/frxusd-contracts
export const frxusdChains: Record<string, TokenConfig> = {
  frax: {
    ...frxusd,
    assetId: "",
    contractAddress: "0xFc00000000000000000000000000000000000001",
    ...chains.frax,
    services: [Service.FraxZero],
  },
  eth: {
    ...frxusd,
    assetId: "",
    contractAddress: "0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29",
    ...chains.eth,
    services: [Service.FraxZero],
  },
  arb: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    ...chains.arb,
    services: [Service.FraxZero],
  },
  avax: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    ...chains.avax,
    services: [Service.FraxZero],
  },
  // base: {
  //   ...frxusd,
  //   assetId: "",
  //   contractAddress: "0xe5020A6d073a794B6E7f05678707dE47986Fb0b6",
  //   ...chains.base,
  //   services: [Service.FraxZero],
  // },
  bera: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    ...chains.bera,
    services: [Service.FraxZero],
  },
  bsc: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    ...chains.bsc,
    services: [Service.FraxZero],
  },
  op: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    ...chains.op,
    services: [Service.FraxZero],
  },
  pol: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80Eede496655FB9047dd39d9f418d5483ED600df",
    ...chains.pol,
    services: [Service.FraxZero],
  },
  xlayer: {
    ...frxusd,
    assetId: "",
    contractAddress: "0x80eede496655fb9047dd39d9f418d5483ed600df",
    ...chains.xlayer,
    services: [Service.FraxZero],
  },
  sol: {
    ...frxusd,
    assetId: "",
    contractAddress: "GzX1ireZDU865FiMaKrdVB1H6AE8LAqWYCg6chrMrfBw",
    decimals: 9,
    ...chains.sol,
    services: [Service.FraxZero],
  },
};

export const frxusdSol = {
  ...frxusd,
  ...frxusdChains.sol,
  chains: [frxusdChains.sol],
};

export const frxusdEvm = {
  ...frxusd,
  chains: Object.values(frxusdChains).filter((chain) => chain.chainType === "evm")
};
