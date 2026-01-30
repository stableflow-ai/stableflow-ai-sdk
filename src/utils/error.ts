import Big from "big.js";
import { Service, ServiceType } from "../core/Service";
import { TokenConfig } from "../models/Token";

export const formatQuoteError = (error: any, options: { service: ServiceType; fromToken: TokenConfig; }) => {
  const { service, fromToken } = options;

  const defaultErrorMessage = "Failed to get quote, please try again later";

  if (service === Service.OneClick) {
    const getQuoteErrorMessage = (): { message: string; sourceMessage: string; } => {
      const _messageResult = {
        message: defaultErrorMessage,
        sourceMessage: error?.response?.data?.message || defaultErrorMessage,
      };
      if (
        error?.response?.data?.message &&
        error?.response?.data?.message !== "Internal server error"
      ) {
        // quote failed, maybe out of liquidity
        if (error?.response?.data?.message === "Failed to get quote") {
          _messageResult.message = "Amount exceeds max";
          return _messageResult;
        }
        // Amount is too low for bridge
        if (error?.response?.data?.message?.includes("Amount is too low for bridge, try at least")) {
          const match = error.response.data.message.match(/try at least\s+(\d+(?:\.\d+)?)/i);
          let minimumAmount = match ? match[1] : Big(1).times(10 ** fromToken.decimals).toFixed(0);
          minimumAmount = Big(minimumAmount).div(10 ** fromToken.decimals).toFixed(fromToken.decimals);
          _messageResult.message = `Amount is too low, at least ${minimumAmount}`;
          return _messageResult;
        }
        return _messageResult;
      }
      // Unknown error
      return _messageResult;
    };
    const onclickErrMsg = getQuoteErrorMessage();
    return {
      serviceType: service,
      error: onclickErrMsg.message,
    };
  }

  return {
    serviceType: service,
    error: error?.message || defaultErrorMessage,
  };
};
