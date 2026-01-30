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

export const BridgeFee = [
  {
    recipient: "reffer.near",
    // No bridge fee will be charged temporarily
    fee: 0, // 100=1% 1=0.01%
  },
];

const excludeFees: string[] = ["sourceGasFeeUsd"];

class OneClickService {
  private offsetTime = 1000 * 60 * 30;
  constructor() {
  }
  public async quote(params: {
    wallet: any,
    fromToken: any,
    toToken: any,
    dry: boolean;
    slippageTolerance: number;
    originAsset: string;
    destinationAsset: string;
    amount: string;
    refundTo: string;
    refundType: "ORIGIN_CHAIN";
    recipient: string;
    connectedWallets?: string[];
    prices: Record<string, string>;
    amountWei: string;
    appFees?: { recipient: string; fee: number; }[];
    swapType?: "EXACT_INPUT" | "EXACT_OUTPUT";
  }) {
    const {
      wallet,
      fromToken,
      toToken,
      prices,
      amountWei,
      appFees = [],
      swapType = "EXACT_INPUT",
      ...restParams
    } = params;
    const response: any = await request(OpenAPI, {
      method: 'POST',
      url: '/v0/quote',
      body: {
        depositMode: "SIMPLE",
        swapType,
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
        ...restParams,
      },
      mediaType: 'application/json',
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });

    const res = { data: response };

    if (res.data) {
      res.data.quoteParam = params;
      res.data.estimateTime = res.data?.quote?.timeEstimate; // seconds
      res.data.outputAmount = numberRemoveEndZero(Big(res.data?.quote?.amountOut || 0).div(10 ** params.toToken.decimals).toFixed(params.toToken.decimals, 0));

      try {
        // const bridgeFee = BridgeFee.reduce((acc, item) => {
        //   return acc.plus(Big(item.fee).div(100));
        // }, Big(0)).toFixed(2) + "%";
        let netFee = Big(params.amount).div(10 ** params.fromToken.decimals).minus(Big(res.data?.quote?.amountOut || 0).div(10 ** params.toToken.decimals));
        if (swapType === "EXACT_OUTPUT") {
          netFee = Big(res.data?.quote?.amountIn || 0).div(10 ** params.toToken.decimals).minus(Big(params.amount).div(10 ** params.fromToken.decimals));
        }
        const bridgeFeeValue = BridgeFee.reduce((acc, item) => {
          return acc.plus(Big(params.amount).div(10 ** params.fromToken.decimals).times(Big(item.fee).div(10000)));
        }, Big(0));
        const destinationGasFee = Big(netFee).minus(bridgeFeeValue);
        res.data.fees = {
          bridgeFeeUsd: numberRemoveEndZero(Big(bridgeFeeValue).toFixed(20)),
          destinationGasFeeUsd: numberRemoveEndZero(Big(destinationGasFee).toFixed(20)),
        };

        try {
          const sourceGasFee = await params.wallet.estimateTransferGas({
            originAsset: params.fromToken.contractAddress,
            depositAddress: res.data?.quote?.depositAddress || DefaultAddresses[params.fromToken.chainType as ChainType],
            amount: params.amount,
          });
          const sourceGasFeeUsd = Big(sourceGasFee.estimateGas || 0).div(10 ** params.fromToken.nativeToken.decimals).times(getPrice(params.prices, params.fromToken.nativeToken.symbol));
          res.data.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(sourceGasFeeUsd).toFixed(20));
          res.data.estimateSourceGas = sourceGasFee.estimateGas;
          res.data.estimateSourceGasUsd = numberRemoveEndZero(Big(sourceGasFeeUsd).toFixed(20));
        } catch (err) {
          console.log("oneclick estimate gas failed: %o", err);
        }

        // calculate total fees
        for (const feeKey in res.data.fees) {
          if (excludeFees.includes(feeKey)) {
            continue;
          }
          res.data.totalFeesUsd = Big(res.data.totalFeesUsd || 0).plus(res.data.fees[feeKey] || 0);
        }
        res.data.totalFeesUsd = numberRemoveEndZero(Big(res.data.totalFeesUsd).toFixed(20));

      } catch (error) {
        console.log("oneclick estimate failed: %o", error);
      }

      const proxyAddress = ONECLICK_PROXY[params.fromToken.chainName];
      if (proxyAddress) {
        const proxyResult = await params.wallet.quote(Service.OneClick, {
          proxyAddress,
          abi: ONECLICK_PROXY_ABI,
          fromToken: params.fromToken,
          refundTo: params.refundTo,
          recipient: params.recipient,
          amountWei: params.amount,
          prices: params.prices,
          depositAddress: res.data?.quote?.depositAddress || DefaultAddresses[params.fromToken.chainType as ChainType],
        });

        for (const proxyKey in proxyResult) {
          if (proxyKey === "fees") {
            for (const feeKey in proxyResult.fees) {
              if (excludeFees.includes(feeKey)) {
                continue;
              }
              res.data.fees[feeKey] = proxyResult.fees[feeKey];
            }
            continue;
          }
          res.data[proxyKey] = proxyResult[proxyKey];
        }
      }
    }

    return response;
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
