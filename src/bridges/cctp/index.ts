import { CCTP_TOKEN_PROXY, CCTP_TOKEN_PROXY_ABI } from "./contract";
import { CCTP_DOMAINS } from "./config";
import { OpenAPI } from '../../core/OpenAPI';
import { request } from '../../core/request';
import { SendType } from "../../core/Send";
import { Service } from "../../core/Service";
import Big from "big.js";
import { numberRemoveEndZero } from "../../utils/number";
import { ExecTime } from "../../utils/exec-time";

export const PayInLzToken = false;

const excludeFees: string[] = ["estimateGasUsd"];

export class CCTPService {
  constructor() {
  }

  public async quote(params: any) {
    const {
      dry,
      wallet,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
    } = params;

    const _quoteType = `CCTPService ${fromToken?.chainName}->${toToken?.chainName}`;
    const execTime = new ExecTime({ type: _quoteType, logStyle: "indigo-500", isDebug: OpenAPI.DEBUG });

    const sourceDomain = CCTP_DOMAINS[fromToken.chainName];
    const destinationDomain = CCTP_DOMAINS[toToken.chainName];
    const proxyAddress = CCTP_TOKEN_PROXY[fromToken.chainName];

    const result = await wallet.quote(Service.CCTP, {
      dry,
      proxyAddress,
      abi: CCTP_TOKEN_PROXY_ABI,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
      excludeFees,
      destinationDomain,
      sourceDomain,
    });

    execTime.logTotal("CCTPService.quote");

    return result;
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const {
      fromToken,
      wallet,
      prices,
      evmGasFees,
    } = params;

    const result: any = { fees: {}, ...quoteData };

    const ett = await wallet.estimateTransaction({
      dry: false,
      ...quoteData.sendParam,
      fromToken,
      prices,
      evmGasFees,
    });
    result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
    result.estimateSourceGas = ett.estimateSourceGas;
    result.estimateSourceGasUsd = ett.estimateSourceGasUsd;

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
      url: "/v0/trade",
      query: {
        deposit_address: params.hash,
      },
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

export default new CCTPService();
