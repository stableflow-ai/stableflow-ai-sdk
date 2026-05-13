import Big from "big.js";
import { ONECLICK_PROXY, ONECLICK_PROXY_ABI } from "./contract";
import { numberRemoveEndZero } from "../../utils/number";
import { getPrice } from "../../utils/price";
import { SendType } from "../../core/Send";
import { Service } from "../../core/Service";
import { DefaultAddresses } from "../../wallets/config/addresses";
import { OpenAPI } from '../../core/OpenAPI';
import { request } from '../../core/request';
import { ChainType } from "../../wallets/config/chains";
import { ExecTime } from "../../utils/exec-time";
import { Csl } from "../../utils/log";

export const BridgeFee = [
  {
    recipient: "reffer.near",
    // No bridge fee will be charged temporarily
    fee: 0, // 100=1% 1=0.01%
  },
];

export const excludeFees: string[] = ["estimateGasUsd"];

export class OneClickService {
  private offsetTime = 1000 * 60 * 60;
  constructor() {
  }

  public async formatQuoteData(res: { data: any; params: any; }) {
    const { params } = res;
    const { isProxy = true, prices } = params;

    const isExactOutput = params.swapType === "EXACT_OUTPUT";
    const nativeTokenPrice = getPrice(prices, params.fromToken.nativeToken.symbol);
    const nativeTokenDecimals = params.fromToken.nativeToken.decimals;

    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;
    const execTime = new ExecTime({ type: "OneClickService formatQuoteData", logStyle: "lime-300", isDebug: OpenAPI.DEBUG });

    if (res.data) {
      // Updated the time estimate for bridge quotes to ensure it does not exceed a maximum threshold.
      // If the calculated time exceeds 60 seconds, it is randomized between 40 and 45 seconds,
      // enhancing user experience by providing more realistic estimates.
      if (res.data?.quote) {
        if (Big(res.data.quote.timeEstimate || 0).gt(60)) {
          res.data.quote.timeEstimate = Math.floor(Math.random() * 6) + 40;
        }
      }

      res.data.estimateTime = res.data?.quote?.timeEstimate; // seconds
      res.data.outputAmount = numberRemoveEndZero(Big(res.data?.quote?.amountOut || 0).div(10 ** params.toToken.decimals).toFixed(params.toToken.decimals, 0));
      let priceImpact = Big(0);
      let _amountInUsd = res.data?.quote?.amountInUsd || 0;
      let _amountOutUsd = res.data?.quote?.amountOutUsd || 0;
      if (isExactOutput) {
        res.data.quote.amountInFormatted = numberRemoveEndZero(Big(res.data?.quote?.minAmountIn || 0).div(10 ** params.fromToken.decimals).toFixed(params.fromToken.decimals, Big.roundUp));
        // Since 1click does not return minAmountInUsd, we calculate it using our own price
        _amountInUsd = Big(res.data.quote.amountInFormatted).times(getPrice(params.prices, params.fromToken.symbol));
        _amountOutUsd = Big(res.data?.quote?.amountOutFormatted || 0).times(getPrice(params.prices, params.fromToken.symbol));
      }
      try {
        priceImpact = Big(Big(_amountInUsd).minus(_amountOutUsd)).div(_amountInUsd || 1);
        if (Big(priceImpact).lt(0)) {
          priceImpact = Big(0);
        }
      } catch (error) { }
      res.data.priceImpact = numberRemoveEndZero(Big(priceImpact).toFixed(4));

      const fromTokenSymbol = params.fromToken.symbol === "USD₮0" ? "USDT" : params.fromToken.symbol;
      const toTokenSymbol = params.toToken.symbol === "USD₮0" ? "USDT" : params.toToken.symbol;
      res.data.exchangeRate = "1";
      if (fromTokenSymbol !== toTokenSymbol) {
        res.data.exchangeRate = numberRemoveEndZero(Big(res.data.quote?.amountOutFormatted || 0).div(res.data.quote?.amountInFormatted || 1).toFixed(params.toToken.decimals, 0));
      }

      try {
        const netFee = Big(_amountInUsd).minus(_amountOutUsd);
        let bridgeFeeValue = Big(0);
        let destinationGasFee = Big(netFee).minus(bridgeFeeValue);
        destinationGasFee = Big(destinationGasFee).lt(0) ? Big(0) : destinationGasFee;
        if (fromTokenSymbol !== toTokenSymbol) {
          destinationGasFee = Big(0);
        }
        res.data.fees = {
          bridgeFeeUsd: numberRemoveEndZero(Big(bridgeFeeValue).toFixed(20)),
          destinationGasFeeUsd: numberRemoveEndZero(Big(destinationGasFee).toFixed(20)),
        };

        // calculate total fees
        res.data.totalFeesUsd = "0";
        for (const feeKey in res.data.fees) {
          if (excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
            continue;
          }
          res.data.totalFeesUsd = Big(res.data.totalFeesUsd || 0).plus(res.data.fees[feeKey] || 0);
        }
        res.data.totalFeesUsd = numberRemoveEndZero(Big(res.data.totalFeesUsd).toFixed(20));

      } catch (error) {
        csl("OneClickService formatQuoteData", "red-500", "oneclick estimate failed: %o", error);
      }

      const proxyAddress = ONECLICK_PROXY[params.fromToken.chainName];
      let proxyParams: any = {};
      if (proxyAddress && isProxy) {
        proxyParams = {
          dry: params.dry,
          proxyAddress,
          abi: ONECLICK_PROXY_ABI,
          fromToken: params.fromToken,
          refundTo: params.refundTo,
          recipient: params.recipient,
          amountWei: isExactOutput ? res.data?.quote?.minAmountIn : params.amountWei,
          prices: params.prices,
          evmGasFees: params.evmGasFees,
          depositAddress: res.data?.quote?.depositAddress ?? DefaultAddresses[params.fromToken.chainType as ChainType],
        };
        try {
          execTime.breakpoint();
          const proxyResult = await params.wallet.quote(Service.OneClick, proxyParams);
          execTime.log("wallet.quoteOneClickProxy");

          for (const proxyKey in proxyResult) {
            if (proxyKey === "fees") {
              for (const feeKey in proxyResult.fees) {
                if (excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
                  continue;
                }
                res.data.fees[feeKey] = proxyResult.fees[feeKey];
              }
              continue;
            }
            res.data[proxyKey] = proxyResult[proxyKey];
          }

          res.data.transferSourceGasFee = proxyResult.estimateSourceGas;
          const transferSourceGasFeeUsd = Big(proxyResult.estimateSourceGas || 0).div(10 ** params.fromToken.nativeToken.decimals).times(getPrice(params.prices, params.fromToken.nativeToken.symbol));
          res.data.transferSourceGasFeeUsd = numberRemoveEndZero(Big(transferSourceGasFeeUsd).toFixed(20));
        } catch (error) {
          csl("OneClickService formatQuoteData", "red-500", "oneclick quote proxy failed: %o", error);
        }
      }

      res.data.quoteParam = {
        ...params,
        ...proxyParams,
      };
    }

    execTime.logTotal("OneClickService.formatQuoteData");

    return res.data || {};
  }

  public async quote(params: {
    wallet: any,
    fromToken: any,
    toToken: any,
    dry: boolean;
    slippageTolerance: number;
    originAsset: string;
    destinationAsset: string;
    refundTo: string;
    refundType: "ORIGIN_CHAIN";
    recipient: string;
    connectedWallets?: string[];
    prices: Record<string, string>;
    amountWei: string;
    appFees?: { recipient: string; fee: number; }[];
    swapType?: "EXACT_INPUT" | "EXACT_OUTPUT" | "FLEX_INPUT";
    isProxy?: boolean;
  }) {
    const {
      wallet,
      fromToken,
      toToken,
      prices,
      amountWei,
      appFees = [],
      swapType = "EXACT_INPUT",
      isProxy = true,
      ...restParams
    } = params;

    const _quoteType = `OneClickService ${fromToken?.chainName}->${toToken?.chainName}`;
    const execTime = new ExecTime({ type: _quoteType, logStyle: "lime-400", isDebug: OpenAPI.DEBUG });

    const quoteParams: any = {
      depositMode: "SIMPLE",
      swapType: swapType || "EXACT_INPUT",
      depositType: "ORIGIN_CHAIN",
      sessionId: `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      recipientType: "DESTINATION_CHAIN",
      deadline: new Date(Date.now() + this.offsetTime).toISOString(),
      quoteWaitingTimeMs: 3000,
      appFees: [
        ...BridgeFee,
        ...appFees,
      ],
      referral: "stableflow",
      amount: amountWei,
      ...restParams,
    };

    if (swapType === "EXACT_OUTPUT") {
      quoteParams.amount = Big(amountWei || 0).div(10 ** fromToken.decimals).times(10 ** toToken.decimals).toFixed(0);
    }

    execTime.breakpoint();
    const response: any = await request(OpenAPI, {
      method: 'POST',
      url: '/v0/quote',
      body: quoteParams,
      mediaType: 'application/json',
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
    execTime.log("/v0/quote");

    execTime.breakpoint();
    const result = await this.formatQuoteData({ data: response, params });
    execTime.log("formatQuoteData");

    execTime.logTotal("OneClickService.quote");

    return result;
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const {
      fromToken,
      isProxy = true,
      wallet,
      amountWei,
      refundTo,
      prices,
      acceptTronEnergy,
      evmGasFees,
    } = params;

    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;

    const result: any = { fees: {}, ...quoteData };

    const proxyAddress = ONECLICK_PROXY[fromToken.chainName];
    const isFromTron = fromToken.chainType === "tron";
    const isFromTronEnergy = isFromTron && acceptTronEnergy;
    const isFinalProxy = proxyAddress && isProxy;
    const nativeTokenPrice = getPrice(prices, fromToken.nativeToken.symbol);
    const nativeTokenDecimals = fromToken.nativeToken.decimals;

    if (isFromTron) {
      try {
        const _estGas = await wallet.estimateTransferGas({
          fromToken: fromToken,
          depositAddress: DefaultAddresses[fromToken.chainType as ChainType],
          amount: amountWei,
          account: refundTo,
        });
        result.transferSourceGasFee = _estGas.estimateGas;
        const transferSourceGasFeeUsd = Big(result.transferSourceGasFee || 0).div(10 ** nativeTokenDecimals).times(nativeTokenPrice);
        result.transferSourceGasFeeUsd = numberRemoveEndZero(Big(transferSourceGasFeeUsd).toFixed(20));
      } catch (error) {
        csl("OneClickService estimateTransaction", "red-500", "oneclick estimate transaction without proxy failed: %o", error);
      }
    }

    if (isFinalProxy) {
      const estimateTransactionParams = {
        dry: false,
        ...quoteData.sendParam,
        fromToken,
        prices,
        evmGasFees,
      };
      if (isFromTron) {
        estimateTransactionParams.defaultEnergyUsed = 200000;
        estimateTransactionParams.defaultRawDataHexLength = 500;
      }
      const ett = await wallet.estimateTransaction(estimateTransactionParams);
      result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
      result.estimateSourceGas = ett.estimateSourceGas;
      result.totalEstimateSourceGas = ett.estimateSourceGas;
      result.estimateSourceGasUsd = ett.estimateSourceGasUsd;

      result.transferSourceGasFee = ett.estimateSourceGas;
      result.transferSourceGasFeeUsd = ett.estimateSourceGasUsd;
    } else {
      let sourceGasFee = result.transferSourceGasFee || {};
      if (isFromTronEnergy) {
        sourceGasFee = result.energySourceGasFee;
      }
      const estimateGasUsd = Big(sourceGasFee.estimateGas || 0).div(10 ** nativeTokenDecimals).times(nativeTokenPrice);
      result.fees.estimateGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
      result.estimateSourceGas = sourceGasFee.estimateGas;
      result.totalEstimateSourceGas = sourceGasFee.estimateGas;
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
    }

    if (result.needApprove && wallet.estimateApprove) {
      const estApptroveGas = await wallet.estimateApprove({
        dry: false,
        amountWei,
        spender: result.approveSpender,
        fromToken,
        prices,
      });
      result.estimateApproveGas = estApptroveGas.estimateSourceGas;
    }

    result.totalFeesUsd = "0";
    for (const feeKey in result.fees) {
      if (excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
        continue;
      }
      result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
    }
    result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd).toFixed(20));

    return result;
  }

  public async send(params: any) {
    const {
      wallet,
      fromToken,
      depositAddress,
      amountWei,
      sendParam,
    } = params;

    // proxy transfer
    if (sendParam) {
      const tx = await wallet.send(SendType.SEND, sendParam);
      return tx;
    }

    const hash = await wallet.send(SendType.TRANSFER, {
      originAsset: fromToken.contractAddress,
      depositAddress: depositAddress,
      amount: amountWei,
    });
    return hash;
  }

  public async submitHash(params: { txHash: string; depositAddress: string }) {
    return request(OpenAPI, {
      method: 'POST',
      url: '/v0/deposit/submit',
      body: params,
      mediaType: 'application/json',
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
  }

  public async getStatus(params: {
    depositAddress: string;
    depositMemo?: string;
  }) {
    return request(OpenAPI, {
      method: 'GET',
      url: '/v0/status',
      query: params,
      errors: {
        401: `Unauthorized - JWT token is invalid`,
        404: `Deposit address not found`,
      },
    });
  }
}

export default new OneClickService();
