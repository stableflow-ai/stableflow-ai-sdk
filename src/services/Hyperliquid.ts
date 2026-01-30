import { ethers } from 'ethers';
import { request as __request } from '../core/request';
import { usdcChains } from '../wallets/config/usdc';
import { getRpcUrls } from '../wallets/config/rpcs';
import { ServiceMap } from '../bridges';
import { Service } from '../core/Service';
import { WalletConfig } from '../models/Wallet';
import { TokenConfig } from '../models/Token';
import { formatQuoteError } from '../utils/error';
import { tokens } from '../wallets/config/tokens';
import EVMWallet from '../wallets/evm';
import { OpenAPI } from '../core/OpenAPI';
import Big from 'big.js';

const SPENDER = "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7";
const DESTINATION_TOKEN = usdcChains["arb"];
const MIN_AMOUNT = Big(5).times(10 ** DESTINATION_TOKEN.decimals).toFixed(0);

class HyperliquidService {
  public async quote(params: HyperliquidQuoteParams): Promise<{ quote: any; error: string | null; }> {

    const result: { quote: any; error: string | null; } = { quote: null, error: null };

    if (Big(params.amountWei || 0).lt(MIN_AMOUNT)) {
      result.error = `Amount is too low, at least ${MIN_AMOUNT}`;
      return result;
    }

    const quoteParams = {
      ...params,
      dry: params.dry ?? true,
      slippageTolerance: params.slippageTolerance * 100,
      originAsset: params.fromToken.assetId,
      toToken: DESTINATION_TOKEN,
      destinationAsset: DESTINATION_TOKEN.assetId,
      amount: params.amountWei,
      refundType: "ORIGIN_CHAIN",
      appFees: params.oneclickParams?.appFees,
      swapType: "EXACT_OUTPUT",
      isProxy: false,
    };

    try {
      const quoteRes = await ServiceMap[Service.OneClick].quote(quoteParams);
      result.quote = quoteRes;
    } catch (error) {
      const _err = formatQuoteError(error, { service: Service.OneClick, fromToken: params.fromToken });
      result.error = _err.error;
    }

    return result;
  }

  public async transfer(params: HyperliquidTransferParams): Promise<string> {
    const {
      quote,
      wallet,
    } = params;

    const sendParams = {
      wallet,
      sendParam: quote?.sendParam,
      fromToken: quote?.quoteParam.fromToken,
      depositAddress: quote?.quote?.depositAddress,
      amountWei: quote?.quote?.amountIn,
    };

    const txhash = await ServiceMap[Service.OneClick].send(sendParams);

    return txhash;
  }

  public async deposit(params: HyperliquidDepositParams): Promise<HyperliquidDepositResponse> {
    const {
      evmWallet,
      evmWalletAddress,
      quote,
      txhash,
    } = params;

    const permitParams = await this.generatePermit({
      address: evmWalletAddress,
      evmWallet,
      amountWei: quote?.quote?.amountOut,
    });

    const depositParams = {
      deposit_address: quote?.quote?.depositAddress,
      from_addr: quote?.quoteParam?.refundTo,
      from_amount: quote?.quote?.amountIn,
      from_chain: quote?.quoteParam?.fromToken?.blockchain,
      from_hash: txhash,
      from_token: quote?.quoteParam?.fromToken?.contractAddress,
      sender: quote?.quoteParam?.recipient,
      to_amount: quote?.quote?.amountOut,
      to_chain: quote?.quoteParam?.toToken?.blockchain,
      to_token: quote?.quoteParam?.toToken?.contractAddress,
      type: Service.OneClick,

      permit: permitParams,
    };

    const depositRes = await __request(OpenAPI, {
      method: "POST",
      url: "/v0/deposit",
      body: depositParams,
      mediaType: "application/json",
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });

    return depositRes as HyperliquidDepositResponse;
  }

  public async getStatus(params: HyperliquidGetStatusParams): Promise<HyperliquidDepositStatusResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/v0/deposit",
      query: {
        depositId: params.depositId,
      },
      mediaType: "application/json",
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
  }

  protected async generatePermit(params: HyperliquidGeneratePermitParams) {
    const {
      address,
      evmWallet,
      amountWei,
    } = params;

    const tokenAddress = DESTINATION_TOKEN.contractAddress;
    const name = DESTINATION_TOKEN.name;
    const chainId = DESTINATION_TOKEN.chainId;

    const provider = new ethers.JsonRpcProvider(getRpcUrls("arb")[0]);
    const erc20 = new ethers.Contract(
      tokenAddress,
      [
        "function name() view returns (string)",
        "function nonces(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ],
      provider
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400;
    const nonce = await erc20.nonces(address);
    const value = amountWei;

    const domain = {
      name,
      version: "2",
      chainId: Number(chainId),
      verifyingContract: tokenAddress
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };

    const values = {
      owner: address,
      spender: SPENDER,
      value,
      nonce: nonce.toString(),
      deadline
    };

    const signature = await evmWallet.signTypedData({
      domain,
      types,
      values
    });

    const { v, r, s } = ethers.Signature.from(signature);

    const permitParams = {
      amount: value,
      deadline,
      owner: address,
      r,
      s,
      spender: SPENDER,
      token: tokenAddress,
      v,
      nonce: Number(nonce),
    };

    return permitParams;
  }
}

export const Hyperliquid = new HyperliquidService();

export const HyperliquidFromTokens = tokens.filter((token) => !(token.chainName === "Arbitrum" && token.symbol === "USDC"));
export const HyperliuquidToToken = DESTINATION_TOKEN;
export const HyperliuquidMinAmount = MIN_AMOUNT;

export interface HyperliquidQuoteParams {
  slippageTolerance: number;
  refundTo: string;
  recipient: string;
  wallet: WalletConfig;
  fromToken: TokenConfig;
  prices: Record<string, string>;
  amountWei: string;
  // Whether to generate deposit address
  // false will generate a deposit address
  dry?: boolean;
  oneclickParams?: {
    appFees?: { recipient: string; fee: number; }[];
  };
}

export interface HyperliquidTransferParams {
  // bridge wallet
  wallet: WalletConfig;
  // deposit wallet (evm wallet)
  evmWallet: EVMWallet;
  // deposit wallet address
  evmWalletAddress: string;
  // quote result with deposit address
  quote: any;
}

export interface HyperliquidGeneratePermitParams {
  address: string;
  evmWallet: EVMWallet;
  amountWei: string;
}

export interface HyperliquidDepositParams extends HyperliquidTransferParams {
  txhash: string;
}

export interface HyperliquidGetStatusParams {
  depositId: string;
}

export interface HyperliquidResponse<T> {
  code: number;
  data: T;
}

export interface HyperliquidDepositResponseData {
  depositId: number;
}

export type HyperliquidDepositResponse = HyperliquidResponse<HyperliquidDepositResponseData>;

export type HyperliquidDepositStatus = "PROCESSING" | "SUCCESS" | "REFUNDED" | "FAILED";

export interface HyperliquidDepositStatusResponseData {
  status: HyperliquidDepositStatus;
  txHash: string;
}

export type HyperliquidDepositStatusResponse = HyperliquidResponse<HyperliquidDepositStatusResponseData>;
