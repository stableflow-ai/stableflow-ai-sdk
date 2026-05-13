import oneClickService from "./oneclick";
import usdt0Service from "./usdt0";
import cctpService from "./cctp";
import fraxzeroService from "./fraxzero";
import fraxZeroOneClickService from "./fraxzero/to-oneclick";
import oneClickFraxZeroService from "./fraxzero/from-oneclick";
import usdt0OneClickService from "./usdt0/to-oneclick";
import oneClickUsdt0Service from "./usdt0/from-oneclick";
import nativeService from "./native";
import { Service } from "../core/Service";

export const ServiceMap: Record<Service, any> = {
  [Service.OneClick]: oneClickService,
  [Service.Usdt0]: usdt0Service,
  [Service.CCTP]: cctpService,
  [Service.FraxZero]: fraxzeroService,
  [Service.FraxZeroOneClick]: fraxZeroOneClickService,
  [Service.OneClickFraxZero]: oneClickFraxZeroService,
  [Service.Usdt0OneClick]: usdt0OneClickService,
  [Service.OneClickUsdt0]: oneClickUsdt0Service,
  [Service.Native]: nativeService,
};
