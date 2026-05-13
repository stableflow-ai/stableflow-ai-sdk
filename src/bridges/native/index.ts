import { formatNumber } from "../../utils/number";
import type { AxiosInstance } from "axios";
import axios from "axios";
import Big from "big.js";
import { NativeChains, NativeV4Routes } from "./contract";
import { ExecTime } from "../../utils/exec-time";
import { request } from "../../core/request";
import { OpenAPI } from "../../core/OpenAPI";
import { Service } from "../../core/Service";

export class NativeService {
  public async quote(params: any) {
    const {
      dry,
      wallet,
      amountWei,
      refundTo,
      fromToken,
      toToken,
      prices,
      recipient,
      slippageTolerance,
    } = params;

    const _quoteType = `NativeService ${fromToken?.chainName}->${toToken?.chainName}`;
    const execTime = new ExecTime({ type: _quoteType, logStyle: "indigo-600", isDebug: OpenAPI.DEBUG });

    const isSwap = fromToken.chainName === toToken.chainName;

    let quoteUri = "/firm-quote";
    const quoteParams: any = {
      version: 4,
      from_address: refundTo,
      to_address: recipient,
      beneficiary_address: recipient,
      refund_to: refundTo,
      src_chain: NativeChains[fromToken.chainName],
      dst_chain: NativeChains[toToken.chainName],
      token_in: fromToken.contractAddress,
      token_out: toToken.contractAddress,
      amount_wei: amountWei,
      expiry_time: 90, // 90 seconds
      timeout_millis: 3000, // 3 seconds
      slippage: slippageTolerance,
      allow_multihop: true
    };

    if (dry) {
      quoteUri = "/indicative-quote";
    }

    if (!isSwap) {
      quoteUri = `/bridge${quoteUri}`;
    }

    execTime.breakpoint();
    const response: any = await request(OpenAPI, {
      method: 'POST',
      url: "/v0" + quoteUri,
      body: quoteParams,
      mediaType: 'application/json',
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
    console.log("response: %o", response)
    execTime.log("Native API");

    // if (res.status !== 200 || !res.data?.success) {
    //   let errorMessage = res.data?.message || "Native quote failed";
    //   // requested amount smaller than token in minimum wei [18446744073709551615]
    //   if (errorMessage.includes("requested amount smaller than token in minimum wei")) {
    //     const match = errorMessage.match(/\[(\d+)\]/);
    //     if (match) {
    //       const minWei = match[1];
    //       const minAmount = Big(minWei).div(10 ** fromToken.decimals);
    //       errorMessage = `Amount is too low, at least ${formatNumber(minAmount, fromToken.decimals, true)} ${fromToken.symbol}`;
    //     }
    //   }
    //   if (errorMessage.includes("requested amount smaller than token out minimum wei")) {
    //     const match = errorMessage.match(/\[(\d+)\]/);
    //     if (match) {
    //       const minWei = match[1];
    //       const minAmount = Big(minWei).div(10 ** toToken.decimals);
    //       errorMessage = `Amount is too low. A minimum of ${formatNumber(minAmount, toToken.decimals, true)} ${toToken.symbol} must be output.`;
    //     }
    //   }
    //   throw new Error(errorMessage);
    // }

    // execTime.breakpoint();
    // const result = await wallet.quote(Service.Native, {
    //   ...params,
    //   ...quoteParams,
    //   quoteResponse: response,
    //   bridgeRouterAddress: isSwap ? NativeV4Routes[fromToken.chainName].swap : NativeV4Routes[fromToken.chainName].bridge,
    // });
    // execTime.log("wallet.quoteNative");

    // execTime.logTotal("NativeService.quote");

    // return result;

    return {};
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const { } = params;

    return quoteData;
  }

  public async send(params: any) {
    const {
      wallet,
      txRequest,
    } = params;

    const txResponse = await wallet.signer.sendTransaction({
      to: txRequest.target,
      data: txRequest.calldata,
      value: txRequest.value,
      gasLimit: txRequest.gasLimit,
    });

    // wait for tx to be mined
    await txResponse.wait();

    return txResponse.hash;
  }

  public async getStatus(params: {
    hash?: string;
  }) {
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

export default new NativeService();
