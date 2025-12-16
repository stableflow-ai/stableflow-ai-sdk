import { CCTP_TOKEN_PROXY, CCTP_TOKEN_PROXY_ABI } from "./contract";
import { CCTP_DOMAINS } from "./config";
import { OpenAPI } from '../../core/OpenAPI';
import { request } from '../../core/request';
import { SendType } from "../../core/Send";
import { Service } from "../../core/Service";

export const PayInLzToken = false;

const excludeFees: string[] = ["estimateApproveGasUsd"];

class CCTPService {
  constructor() {
  }

  public async quoteSignature(params: any) {
    const response: any = await request(OpenAPI, {
      method: 'POST',
      url: "/v0/cctp/sign",
      body: params,
      headers: {
        "Content-Type": "application/json"
      },
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
    return response.data ?? {};
  }

  public async quote(params: any) {
    const {
      wallet,
      // originChain,
      // destinationChain,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
    } = params;

    const sourceDomain = CCTP_DOMAINS[fromToken.chainName];
    const destinationDomain = CCTP_DOMAINS[toToken.chainName];
    const proxyAddress = CCTP_TOKEN_PROXY[fromToken.chainName];

    return wallet.quote(Service.CCTP, {
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
