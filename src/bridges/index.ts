import oneClickService from "./oneclick";
import usdt0Service from "./usdt0";
import cctpService from "./cctp";
import { Service, ServiceType } from "../core/Service";

export const ServiceMap: Record<ServiceType, any> = {
  [Service.OneClick]: oneClickService,
  [Service.Usdt0]: usdt0Service,
  [Service.CCTP]: cctpService,
};

export const ServiceLogoMap: Record<ServiceType, string> = {
  [Service.OneClick]: "/bridge/logo-near-intents.png",
  [Service.Usdt0]: "/bridge/logo-usdt0.svg",
  [Service.CCTP]: "/bridge/logo-circle.avif",
};
