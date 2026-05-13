import oneClickService, { excludeFees as oneClickExcludeFees } from "../oneclick";
import usdt0Service, { excludeFees as usdt0ExcludeFees } from "../usdt0";
import Big from "big.js";
import { MIDDLE_CHAIN_LAYERZERO_EXECUTOR, MIDDLE_CHAIN_REFOUND_ADDRESS, MIDDLE_TOKEN_CHAIN } from "./config";
import { ExecTime } from "../../utils/exec-time";
import { OpenAPI } from "../../core/OpenAPI";
import { numberRemoveEndZero } from "../../utils/number";
import { getPrice } from "../../utils/price";

export class OneClickUsdt0Service {
  public async quote(params: any) {
    const {
      evmWallet,
      evmAddress,
      fromToken,
      prices,
    } = params;

    const execTime = new ExecTime({ type: "OneClickUsdt0", logStyle: "lime-500", isDebug: OpenAPI.DEBUG });

    let middleChainWallet = evmWallet;
    let destinationRecipientAddress = evmAddress;
    if (!middleChainWallet) {
      throw new Error("evmWallet is required");
    }
    if (!destinationRecipientAddress) {
      throw new Error("evmAddress is required");
    }

    // First, call the usdt0 quote method
    // Retrieve sendParam, fees, and estimated costs
    // usdt0 is the second step, so the source chain is arb
    // The refund address is MIDDLE_CHAIN_REFOUND_ADDRESS
    // Since the first step uses oneclick with EXACT_OUTPUT mode,
    // params.amountWei is the input amount for the second step
    const usdt0Params = {
      ...params,
      amountWei: Big(params.amountWei || 0).div(10 ** fromToken.decimals).times(10 ** MIDDLE_TOKEN_CHAIN.decimals).toFixed(0),
      fromToken: MIDDLE_TOKEN_CHAIN,
      originChain: MIDDLE_TOKEN_CHAIN.chainName,
      refundTo: MIDDLE_CHAIN_REFOUND_ADDRESS,
      wallet: middleChainWallet,
    };

    execTime.breakpoint();
    const usdt0Result = await usdt0Service.quote(usdt0Params);
    execTime.log("usdt0Service.quote");

    const usdt0MessageFeeBuffer = 1.2;
    usdt0Result.fees.nativeFeeUsd = numberRemoveEndZero(Big(usdt0Result.fees?.nativeFeeUsd || 0).times(1 + usdt0MessageFeeBuffer).toFixed(20));
    usdt0Result.fees.nativeFee = numberRemoveEndZero(Big(usdt0Result.fees?.nativeFee || 0).times(1 + usdt0MessageFeeBuffer).toFixed(fromToken.nativeToken.decimals));
    // LZ message fee to USD
    const usdt0MessageFeeUsd = usdt0Result.fees.nativeFeeUsd;
    // add 20% buffer
    const usdt0MessageFeeAmount = Big(usdt0MessageFeeUsd || 0).div(getPrice(prices, MIDDLE_TOKEN_CHAIN.symbol) || 1).toFixed(MIDDLE_TOKEN_CHAIN.decimals);

    if (usdt0Result.errMsg) {
      return usdt0Result;
    }

    // OneClick charges a proportional fee
    // The OneClick fee ratio is calculated based on usdt0MessageFeeAmount
    // fee bp = fee amount / (fee amount + amount), minimum is 1, maximum is 10000
    const oneClickFeeRatio = Big(usdt0MessageFeeAmount || 0)
      .div(Big(usdt0MessageFeeAmount || 0).plus(Big(params.amountWei).div(10 ** fromToken.decimals).toFixed(fromToken.decimals)))
      .times(10000)
      .toFixed(0, Big.roundUp);

    // csl("OneClickUsdt0Service quote", "rose-400", "usdt0MessageFeeAmount: %o", usdt0MessageFeeAmount);
    // csl("OneClickUsdt0Service quote", "rose-400", "amount: %o", Big(params.amountWei).div(10 ** fromToken.decimals).toFixed(fromToken.decimals));
    // csl("OneClickUsdt0Service quote", "rose-400", "oneClickFeeRatio: %o", oneClickFeeRatio);

    if (Big(oneClickFeeRatio).gt(10000)) {
      return { errMsg: `Amount is too low, at least ${usdt0MessageFeeAmount}` };
    }

    // Call oneclick quote method again
    // The destination chain is arb
    // Since the exact amount transferred by oneclick needs to be signed, EXACT_OUTPUT mode must be used
    // In EXACT_OUTPUT mode, the output amount equals the expected value
    execTime.breakpoint();
    const oneClickResult = await oneClickService.quote({
      ...params,
      toToken: MIDDLE_TOKEN_CHAIN,
      destinationAsset: MIDDLE_TOKEN_CHAIN.assetId,
      swapType: "EXACT_OUTPUT",
      isProxy: true,
      recipient: destinationRecipientAddress,
      appFees: [
        {
          recipient: "reffer.near",
          // No bridge fee will be charged temporarily
          fee: +oneClickFeeRatio, // 10000 = 100% 1000 = 10% 100=1% 1=0.01%
        },
      ],
    });
    execTime.log("oneClickService.quote");

    let totalFeesUsd = Big(0);
    let _destinationGasFeeUsd = Big(oneClickResult.fees?.destinationGasFeeUsd || 0).minus(usdt0MessageFeeUsd);
    if (Big(_destinationGasFeeUsd).lt(0)) {
      _destinationGasFeeUsd = Big(0);
    }
    const fees = {
      ...oneClickResult.fees,
      destinationGasFeeUsd: numberRemoveEndZero(Big(_destinationGasFeeUsd).toFixed(20)),
    };
    for (const feeKey in usdt0Result.fees) {
      if (usdt0ExcludeFees.includes(feeKey)) {
        continue;
      }
      fees[feeKey] = usdt0Result.fees[feeKey];
    }
    for (const feeKey in fees) {
      if (oneClickExcludeFees.includes(feeKey)) {
        continue;
      }
      totalFeesUsd = Big(totalFeesUsd || 0).plus(fees[feeKey] || 0);
    }

    const usdt0SendParam = usdt0Result.sendParam?.param?.[0];
    const usdt0MessageFee = usdt0Result.sendParam?.param?.[1];

    execTime.log("OneClickUsdt0Service.quote");

    return {
      ...oneClickResult,
      needPermit: true,
      permitSpender: MIDDLE_CHAIN_LAYERZERO_EXECUTOR,
      permitToken: MIDDLE_TOKEN_CHAIN,
      permitAmountWei: oneClickResult?.quote?.amountOut,
      permitAdditionalData: {
        amount_ld: usdt0SendParam?.amountLD,
        compose_msg: usdt0SendParam?.composeMsg,
        dst_eid: usdt0SendParam?.dstEid,
        extra_options: usdt0SendParam?.extraOptions,
        min_amount_ld: usdt0SendParam?.minAmountLD?.toString(),
        oft_cmd: usdt0SendParam?.oftCmd,
        to: usdt0SendParam?.to,
        native_fee: usdt0MessageFee?.nativeFee?.toString(),
      },
      fees,
      totalFeesUsd: numberRemoveEndZero(Big(totalFeesUsd).toFixed(20)),
      estimateTime: usdt0Result.estimateTime + oneClickResult.estimateTime,
      outputAmount: usdt0Result.outputAmount,
      quoteParam: {
        ...oneClickResult.quoteParam,
        toToken: params.toToken,
        middleToken: MIDDLE_TOKEN_CHAIN,
        recipient: params.recipient,
        isOriginLegacy: usdt0Result.quoteParam?.isOriginLegacy,
        isDestinationLegacy: usdt0Result.quoteParam?.isDestinationLegacy,
      },
      usdt0SendParam,
      usdt0MessageFee,
    };
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const { } = params;

    return oneClickService.estimateTransaction(params, quoteData);
  }

  public async send(params: any) {
    return oneClickService.send(params);
  }

  public async getStatus(params: any) {
    return oneClickService.getStatus(params);
  }
}

export default new OneClickUsdt0Service();
