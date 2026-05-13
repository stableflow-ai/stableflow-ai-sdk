import { Service } from "../../core/Service";

export const getQuoteModes = (params: { quoteData?: any; bridgeStore?: { quoteDataService: Service; } }) => {
  const { quoteData, bridgeStore } = params;
  const { quoteDataService } = bridgeStore ?? {};

  const getIsExactOutput = () => {
    if (typeof quoteDataService === "undefined") {
      return false;
    }
    if (([Service.OneClickUsdt0] as Service[]).includes(quoteDataService)) {
      return true;
    }
    if (quoteDataService === Service.OneClickFraxZero) {
      const isFromEthereumUSDC = quoteData?.quoteParam?.isFromEthereumUSDC;
      const isToEthereumFrxUSD = quoteData?.quoteParam?.isToEthereumFrxUSD;
      if (!isFromEthereumUSDC) {
        return true;
      }
    }
    return false;
  };

  const getIsOneClickService = () => {
    if (typeof quoteDataService === "undefined") {
      return false;
    }
    if (([Service.OneClickUsdt0, Service.OneClick] as Service[]).includes(quoteDataService)) {
      return true;
    }
    if (quoteDataService === Service.OneClickFraxZero) {
      const isFromEthereumUSDC = quoteData?.quoteParam?.isFromEthereumUSDC;
      const isToEthereumFrxUSD = quoteData?.quoteParam?.isToEthereumFrxUSD;
      if (!isFromEthereumUSDC) {
        return true;
      }
    }
    return false;
  };

  const getIsQuoteParamDepositAddress = () => {
    if (typeof quoteDataService === "undefined") {
      return false;
    }
    if (([Service.Usdt0OneClick] as Service[]).includes(quoteDataService)) {
      return true;
    }
    if (quoteDataService === Service.FraxZeroOneClick) {
      const isFromEthereumFrxUSD = quoteData?.quoteParam?.isFromEthereumFrxUSD;
      const isToEthereumUSDC = quoteData?.quoteParam?.isToEthereumUSDC;
      if (!isToEthereumUSDC) {
        return true;
      }
    }

    return false;
  };

  return {
    isExactOutput: getIsExactOutput(),
    isOneClickService: getIsOneClickService(),
    isQuoteParamDepositAddress: getIsQuoteParamDepositAddress(),
    isPermitWithNonce: typeof quoteDataService === "undefined" ? false : ([Service.OneClickUsdt0, Service.OneClickFraxZero, Service.FraxZeroOneClick] as Service[]).includes(quoteDataService),
  };
};
