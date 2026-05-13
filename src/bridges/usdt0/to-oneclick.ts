import { SendType } from "../../core/Send";
import oneClickService, { excludeFees as oneClickExcludeFees } from "../oneclick";
import usdt0Service, { excludeFees as usdt0ExcludeFees } from "../usdt0";
import Big from "big.js";
import { MIDDLE_CHAIN_REFOUND_ADDRESS, MIDDLE_TOKEN_CHAIN } from "./config";
import { ExecTime } from "../../utils/exec-time";
import { OpenAPI } from "../../core/OpenAPI";
import { Csl } from "../../utils/log";
import { numberRemoveEndZero } from "../../utils/number";

export class Usdt0OneClickService {
  public async quote(params: any) {
    const {
      dry,
      evmWallet,
      evmAddress,
      fromToken,
    } = params;

    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;
    const execTime = new ExecTime({ type: "Usdt0OneClickService", logStyle: "lime-700", isDebug: OpenAPI.DEBUG });

    let middleChainWallet = evmWallet;
    if (!middleChainWallet) {
      throw new Error("evmWallet is required");
    }

    const usdt0Params = {
      ...params,
      toToken: MIDDLE_TOKEN_CHAIN,
      destinationChain: MIDDLE_TOKEN_CHAIN.chainName,
      recipient: MIDDLE_CHAIN_REFOUND_ADDRESS,
    };
    const oneClickParams = {
      ...params,
      fromToken: MIDDLE_TOKEN_CHAIN,
      originAsset: MIDDLE_TOKEN_CHAIN.assetId,
      swapType: "FLEX_INPUT",
      isProxy: false,
      refundTo: MIDDLE_CHAIN_REFOUND_ADDRESS,
      wallet: middleChainWallet,
    };

    let oneClickResult: any;
    let usdt0Result: any;
    if (dry) {
      execTime.breakpoint();
      const mergedQuotes = [
        oneClickService.quote(oneClickParams),
        usdt0Service.quote(usdt0Params)
      ];
      const merdedRes = await Promise.all(mergedQuotes);
      oneClickResult = merdedRes[0];
      usdt0Result = merdedRes[1];
      execTime.log("oneClickService.quote & usdt0Service.quote");
    }
    // not dry
    else {
      execTime.breakpoint();
      oneClickResult = await oneClickService.quote(oneClickParams);
      execTime.log("oneClickService.quote");

      if (oneClickResult.errMsg) {
        return oneClickResult;
      }

      if (!dry) {
        usdt0Params.recipient = oneClickResult.quote.depositAddress;
      }

      execTime.breakpoint();
      usdt0Result = await usdt0Service.quote(usdt0Params);
      execTime.log("usdt0Service.quote");
    }

    csl("Usdt0OneClickService quote", "rose-600", "oneClickResult: %o", oneClickResult);
    csl("Usdt0OneClickService quote", "rose-600", "usdt0Result: %o", usdt0Result);

    let totalFeesUsd = Big(0);
    const fees = {
      ...usdt0Result.fees,
    };
    for (const feeKey in oneClickResult.fees) {
      if (oneClickExcludeFees.includes(feeKey)) {
        continue;
      }
      fees[feeKey] = oneClickResult.fees[feeKey];
    }
    for (const feeKey in fees) {
      if (usdt0ExcludeFees.includes(feeKey)) {
        continue;
      }
      totalFeesUsd = Big(totalFeesUsd || 0).plus(fees[feeKey] || 0);
    }

    execTime.logTotal("Usdt0OneClickService.quote");

    return {
      ...usdt0Result,
      fees,
      totalFeesUsd: numberRemoveEndZero(Big(totalFeesUsd).toFixed(20)),
      estimateTime: usdt0Result.estimateTime + oneClickResult.estimateTime,
      outputAmount: oneClickResult.outputAmount,
      priceImpact: oneClickResult.priceImpact,
      exchangeRate: oneClickResult.exchangeRate,
      quoteParam: {
        ...usdt0Result.quoteParam,
        toToken: params.toToken,
        middleToken: MIDDLE_TOKEN_CHAIN,
        recipient: params.recipient,
        depositAddress: oneClickResult.quote.depositAddress,
      },
    };
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const { } = params;

    return usdt0Service.estimateTransaction(params, quoteData);
  }

  public async send(params: any) {
    const {
      wallet,
      ...rest
    } = params;

    return wallet.send(SendType.SEND, rest);
  }

  public async getStatus(params: any) {
    return usdt0Service.getStatus(params);
  }
}

export default new Usdt0OneClickService();
