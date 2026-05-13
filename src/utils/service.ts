import { Service } from "../core/Service";

export const getRouteStatus = (service: Service, disabledServices?: Service[]): { disabled: boolean; } => {
  const result = { disabled: false };

  if (!disabledServices || disabledServices.length === 0) {
    return result;
  }

  const IS_PAUSE_ONECLICK = disabledServices.includes(Service.OneClick);
  const IS_PAUSE_USDT0 = disabledServices.includes(Service.Usdt0);
  const IS_PAUSE_CCTP = disabledServices.includes(Service.CCTP);
  const IS_PAUSE_FRAXZERO = disabledServices.includes(Service.FraxZero);
  const IS_PAUSE_NATIVE = disabledServices.includes(Service.Native);
  const IS_PAUSE_USDT0_ONECLICK = disabledServices.includes(Service.OneClickUsdt0);
  const IS_PAUSE_ONECLICK_USDT0 = disabledServices.includes(Service.OneClickUsdt0);
  const IS_PAUSE_FRAXZERO_ONECLICK = disabledServices.includes(Service.FraxZeroOneClick);
  const IS_PAUSE_ONECLICK_FRAXZERO = disabledServices.includes(Service.OneClickFraxZero);
  const IS_PAUSE_ALL = IS_PAUSE_ONECLICK
    && IS_PAUSE_USDT0
    && IS_PAUSE_CCTP
    && IS_PAUSE_FRAXZERO
    && IS_PAUSE_NATIVE;

  if (IS_PAUSE_ALL) {
    result.disabled = true;
    return result;
  }

  if (service === Service.CCTP) {
    if (IS_PAUSE_CCTP) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.FraxZero) {
    if (IS_PAUSE_FRAXZERO) {
      result.disabled = true;
      return result;
    }
  }

  if (([Service.FraxZeroOneClick, Service.OneClickFraxZero] as Service[]).includes(service)) {
    if (IS_PAUSE_ONECLICK || IS_PAUSE_FRAXZERO) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.Native) {
    if (IS_PAUSE_NATIVE) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.OneClick) {
    if (IS_PAUSE_ONECLICK) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.Usdt0) {
    if (IS_PAUSE_USDT0) {
      result.disabled = true;
      return result;
    }
  }

  if (([Service.Usdt0OneClick, Service.OneClickUsdt0] as Service[]).includes(service)) {
    if (IS_PAUSE_ONECLICK || IS_PAUSE_USDT0) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.Usdt0OneClick) {
    if (IS_PAUSE_USDT0_ONECLICK) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.OneClickUsdt0) {
    if (IS_PAUSE_ONECLICK_USDT0) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.FraxZeroOneClick) {
    if (IS_PAUSE_FRAXZERO_ONECLICK) {
      result.disabled = true;
      return result;
    }
  }

  if (service === Service.OneClickFraxZero) {
    if (IS_PAUSE_ONECLICK_FRAXZERO) {
      result.disabled = true;
      return result;
    }
  }

  return result;
};
