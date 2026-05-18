/* StableFlow AI SDK — v3 shell: re-exports @stableflow/* packages */
/* tslint:disable */
/* eslint-disable */

import { warnDeprecated } from './deprecation';

warnDeprecated();

import { SFA as CoreSFA } from '@stableflow/core';
import { BridgeSFA } from '@stableflow/bridges';

/** HTTP helpers from core + full bridge flows from `@stableflow/bridges`. */
export const SFA = Object.assign(CoreSFA, {
  getAllQuote: BridgeSFA.getAllQuote.bind(BridgeSFA),
  send: BridgeSFA.send.bind(BridgeSFA),
  getStatus: BridgeSFA.getStatus.bind(BridgeSFA),
});

export { BridgeSFA } from '@stableflow/bridges';
export type { GetAllQuoteParams } from '@stableflow/bridges';
export {
  ServiceMap,
  getQuoteModes,
  getHopMsgFee,
  LZ_RECEIVE_VALUE,
  USDT0_CONFIG,
  USDT0_LEGACY_MESH_TRANSFTER_FEE,
  DATA_HEX_PROTOBUF_EXTRA,
  SIGNATURE_SIZE,
  OFT_ABI,
  FRAXZERO_MIDDLE_TOKEN_FRXUSD,
  FRAXZERO_MIDDLE_TOKEN_USDC,
  formatNumber,
  addressToBytes32,
  formatQuoteError,
  quoteSignature,
} from '@stableflow/bridges';

export {
  evmRpcFallbackProvider,
  buildEndpointV2LzComposePayload,
  encodeUint,
  normalizeHex,
  toBytes32,
  NATIVE_MSG_FEE_BUFFER,
} from '@stableflow/utils-evm';

export {
  createSolanaFallbackConnection,
  getAvailableSolanaRpcUrl,
  getDestinationAssociatedTokenAddress,
} from '@stableflow/utils-solana';

export { ApiError } from '@stableflow/core';
export { CancelablePromise, CancelError } from '@stableflow/core';
export { OpenAPI } from '@stableflow/core';
export type { OpenAPIConfig } from '@stableflow/core';

export type { AppFee } from '@stableflow/core';
export type { BadRequestResponse } from '@stableflow/core';
export { GetExecutionStatusResponse } from '@stableflow/core';
export type { Quote } from '@stableflow/core';
export { QuoteRequest } from '@stableflow/core';
export type { QuoteResponse } from '@stableflow/core';
export type { SubmitDepositTxRequest } from '@stableflow/core';
export { SubmitDepositTxResponse } from '@stableflow/core';
export type { SwapDetails } from '@stableflow/core';
export { TokenResponse } from '@stableflow/core';
export type { TransactionDetails } from '@stableflow/core';

export {
  Hyperliquid,
  HyperliquidFromTokens,
  HyperliuquidToToken,
  HyperliuquidMinAmount,
} from '@stableflow/hyperliquid';
export type {
  HyperliquidQuoteParams,
  HyperliquidTransferParams,
  HyperliquidDepositParams,
  HyperliquidGetStatusParams,
  HyperliquidDepositResponse,
  HyperliquidDepositStatusResponse,
  HyperliquidDepositStatusResponseData,
  HyperliquidDepositResponseData,
} from '@stableflow/hyperliquid';

export type { TokenConfig } from '@stableflow/core';
export { tokens, usdtTokens, usdcTokens, frxusdTokens } from '@stableflow/core';
export { usdtChains } from '@stableflow/core';
export { usdcChains } from '@stableflow/core';
export { frxusdChains } from '@stableflow/core';
export { usdt0Chains } from '@stableflow/core';

export { NearWallet } from '@stableflow/wallet-near';
export { SolanaWallet } from '@stableflow/wallet-solana';
export { EVMWallet } from '@stableflow/wallet-evm';
export { TronWallet } from '@stableflow/wallet-tron';
export { AptosWallet } from '@stableflow/wallet-aptos';
export { TonWallet } from '@stableflow/wallet-ton';
export { SuiWallet } from '@stableflow/wallet-sui';

export { Service, ServiceBackend, ServiceType } from '@stableflow/core';
export { NetworkRpcUrlsMap, getRpcUrls, setRpcUrls, getChainRpcUrl } from '@stableflow/core';
export { DefaultAddresses } from '@stableflow/core';
export type { ChainType } from '@stableflow/core';
export { erc20Abi } from '@stableflow/core';

export { getPrice, numberRemoveEndZero, Csl, ExecTime, getRouteStatus } from '@stableflow/core';
export { SendType } from '@stableflow/core';

export { TransactionStatus } from '@stableflow/core';
