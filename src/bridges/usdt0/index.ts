import { USDT0_CONFIG, USDT0_DVN_COUNT } from "./config";
import { OFT_ABI, SOLANA_IDL } from "./contract";
import { SendType } from "../../core/Send";
import { Service } from "../../core/Service";
import { OpenAPI } from '../../core/OpenAPI';
import { request } from '../../core/request';
import { ExecTime } from "../../utils/exec-time";
import { calculateEstimateTime } from "../utils";
import { numberRemoveEndZero } from "../../utils/number";
import Big from "big.js";

export const PayInLzToken = false;

export const excludeFees: string[] = ["estimateGasUsd"];

export class Usdt0Service {
  public async quote(params: any) {
    const {
      dry,
      wallet,
      originChain,
      destinationChain,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
    } = params;

    const _quoteType = `Usdt0Service ${fromToken?.chainName}->${toToken?.chainName}`;
    const execTime = new ExecTime({ type: _quoteType, logStyle: "lime-600", isDebug: OpenAPI.DEBUG });

    const originLayerzero = USDT0_CONFIG[originChain];
    const destinationLayerzero = USDT0_CONFIG[destinationChain];

    let originLayerzeroAddress = originLayerzero.oft;
    let destinationLayerzeroAddress = destinationLayerzero.oft;
    let dstEid = destinationLayerzero.eid;

    // Dynamically calculate estimated time
    const estimateTime = calculateEstimateTime({
      requiredDvnCount: USDT0_DVN_COUNT,
      originConfig: originLayerzero,
      destinationConfig: destinationLayerzero,
    });

    if (fromToken.chainType === "evm") {
      destinationLayerzeroAddress = destinationLayerzero.oft || destinationLayerzero.oftLegacy;
      let isOriginLegacy = false;
      let isDestinationLegacy = destinationLayerzeroAddress === destinationLayerzero.oftLegacy;
      if (isDestinationLegacy) {
        originLayerzeroAddress = originLayerzero.oftLegacy || originLayerzero.oft;
        isOriginLegacy = originLayerzeroAddress === originLayerzero.oftLegacy;
      }
      if (!originLayerzeroAddress) {
        originLayerzeroAddress = originLayerzero.oftLegacy;
        isOriginLegacy = true;
        if (destinationLayerzero.oftLegacy) {
          destinationLayerzeroAddress = destinationLayerzero.oftLegacy;
          isDestinationLegacy = true;
        }
      }
      const isBothLegacy = isOriginLegacy && isDestinationLegacy;
      const isBothOUpgradeable = !isOriginLegacy && !isDestinationLegacy;
      const isMultiHopComposer = !isBothLegacy && !isBothOUpgradeable;

      const result = await wallet.quote(Service.Usdt0, {
        dry,
        abi: OFT_ABI,
        dstEid,
        refundTo,
        recipient,
        amountWei,
        slippageTolerance,
        payInLzToken: PayInLzToken,
        fromToken,
        toToken,
        prices,
        originLayerzeroAddress,
        destinationLayerzeroAddress,
        excludeFees,
        multiHopComposer: USDT0_CONFIG["Arbitrum"],
        isMultiHopComposer,
        isOriginLegacy,
        isDestinationLegacy,
        originLayerzero,
        destinationLayerzero,
      });

      result.estimateTime = estimateTime;

      execTime.logTotal("Usdt0Service.quote");
      return result;
    }

    // source chain must be legacy
    const isOriginLegacy = true;
    originLayerzeroAddress = originLayerzero.oftLegacy;
    destinationLayerzeroAddress = destinationLayerzero.oftLegacy || destinationLayerzero.oft;
    const isDestinationLegacy = destinationLayerzeroAddress === destinationLayerzero.oftLegacy;
    const isBothLegacy = isOriginLegacy && isDestinationLegacy;
    const isMultiHopComposer = !isBothLegacy;

    // one is legacy, and one is upgradeable
    // should use multi hop composer
    // and special extraOptions & composeMsg
    if (isMultiHopComposer) {
      dstEid = USDT0_CONFIG["Arbitrum"].eid;
      destinationLayerzeroAddress = USDT0_CONFIG["Arbitrum"].oftMultiHopComposer;
    }

    const oftParams: any = {
      dry,
      dstEid: destinationLayerzero.eid,
      refundTo,
      recipient,
      amountWei,
      slippageTolerance,
      payInLzToken: PayInLzToken,
      fromToken,
      toToken,
      prices,
      originLayerzeroAddress,
      destinationLayerzeroAddress,
      excludeFees,
      multiHopComposer: USDT0_CONFIG["Arbitrum"],
      isMultiHopComposer,
      isOriginLegacy,
      isDestinationLegacy,
      originLayerzero,
      destinationLayerzero,
    };

    if (fromToken.chainType === "tron") {
      oftParams.abi = OFT_ABI;
    }

    if (fromToken.chainType === "sol") {
      oftParams.idl = SOLANA_IDL;
    }

    const result = await wallet.quote(Service.Usdt0, {
      idl: SOLANA_IDL,
      ...oftParams,
    });

    result.estimateTime = estimateTime;

    execTime.logTotal("Usdt0Service.quote");

    return result;
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const {
      fromToken,
      amountWei,
      wallet,
      prices,
      evmGasFees,
    } = params;

    const result: any = { fees: {}, ...quoteData };

    const isFromTron = fromToken.chainType === "tron";
    const nativeTokenDecimals = fromToken.nativeToken.decimals;

    const estimateTransactionParams = {
      dry: false,
      ...quoteData.sendParam,
      fromToken,
      prices,
      evmGasFees,
    };
    if (isFromTron) {
      estimateTransactionParams.defaultEnergyUsed = 300000;
      estimateTransactionParams.defaultRawDataHexLength = 1000;
    }
    const ett = await wallet.estimateTransaction(estimateTransactionParams);
    result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
    result.estimateSourceGas = ett.estimateSourceGas;
    result.estimateSourceGasUsd = ett.estimateSourceGasUsd;
    result.totalEstimateSourceGas = BigInt(Big(quoteData.fees?.nativeFee || 0).times(10 ** nativeTokenDecimals).toFixed(0)) + ett.estimateSourceGas;

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
      ...rest
    } = params;

    return wallet.send(SendType.SEND, rest);
  }

  public async getStatus(params: any) {
    return request(OpenAPI, {
      method: 'GET',
      url: `/v0/messages/tx/${params.hash}`,
      headers: {
        "Content-Type": "application/json"
      },
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
  }
}

export default new Usdt0Service();
