/**
 * @deprecated Please use Service instead
 */
export type ServiceType = "oneclick" | "usdt0" | "cctp" | "fraxzero" | "fraxzero-oneclick" | "oneclick-fraxzero" | "usdt0-oneclick" | "oneclick-usdt0" | "native";

export const Service = {
  OneClick: "oneclick",
  Usdt0: "usdt0",
  CCTP: "cctp",
  FraxZero: "fraxzero",
  FraxZeroOneClick: "fraxzero-oneclick",
  OneClickFraxZero: "oneclick-fraxzero",
  Usdt0OneClick: "usdt0-oneclick",
  OneClickUsdt0: "oneclick-usdt0",
  Native: "native",
} as const;
export type Service = (typeof Service)[keyof typeof Service];

export const ServiceBackend: Record<Service, string> = {
  [Service.OneClick]: "nearintents",
  [Service.Usdt0]: "layerzero",
  [Service.CCTP]: "cctp",
  [Service.FraxZero]: "fraxzero",
  [Service.FraxZeroOneClick]: "fraxzerointent",
  [Service.OneClickFraxZero]: "intentfraxzero",
  [Service.Usdt0OneClick]: "zerointent",
  [Service.OneClickUsdt0]: "intentzero",
  [Service.Native]: "native",
} as const;
