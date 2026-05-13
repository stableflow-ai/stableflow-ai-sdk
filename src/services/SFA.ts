/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
import type { GetExecutionStatusResponse } from '../models/GetExecutionStatusResponse';
import type { QuoteRequest } from '../models/QuoteRequest';
import type { QuoteResponse } from '../models/QuoteResponse';
import type { SubmitDepositTxRequest } from '../models/SubmitDepositTxRequest';
import type { SubmitDepositTxResponse } from '../models/SubmitDepositTxResponse';
import type { TokenResponse } from '../models/TokenResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import { ServiceMap } from '../bridges';
import { Service, ServiceBackend } from '../core/Service';
import { TokenConfig } from '../models/Token';
import { WalletConfig } from '../models/Wallet';
import Big from 'big.js';
import { tokens } from '../wallets/config/tokens';
import { TransactionStatus } from '../models/Status';
import { formatQuoteError } from '../utils/error';
import { getRouteStatus } from '../utils/service';

export interface GetAllQuoteParams {
    /**
     * Optional: query specific service only
     * @example Service.OneClick
     */
    singleService?: Service;
    /**
     * Optional: disabled services
     * @example [Service.OneClick, Service.Usdt0]
     * @description If Service.OneClick is disabled, combined routes involving Service.OneClick will also be disabled: Service.OneClickUsdt0, Service.Usdt0OneClick, Service.OneClickFraxZero, Service.FraxZeroOneClick
     * Other combined routes are the same
     */
    disabledServices?: Service[];
    /**
     * Flag indicating whether this is a dry run request.
     * If `true`, the response will **NOT** contain the following fields:
     * - `depositAddress`
     */
    dry?: boolean;
    /**
     * Token prices (USD)
     * @example { "USDC": "1.001", "USDT": "0.998" }
     */
    prices: Record<string, string>;
    /**
     * Source token configuration
     */
    fromToken: TokenConfig;
    /**
     * Destination token configuration
     */
    toToken: TokenConfig;
    /**
     * Wallet instance (EVMWallet, SolanaWallet, etc.)
     */
    wallet: WalletConfig;
    /**
     * Recipient address on destination chain
     */
    recipient: string;
    /**
     * Refund address on source chain
     */
    refundTo: string;
    /**
     * Amount in smallest units (e.g., wei/etc.)
     */
    amountWei: string;
    /**
     * Slippage tolerance
     * @example 0.5 (0.5%)
     */
    slippageTolerance: number;
    /**
     * Minimum input amount
     */
    minInputAmount?: string;
    /**
     * OneClick route bridge fee
     * @deprecated Please migrate this parameter to oneclickParams as soon as possible; it will be removed in the next version.
     */
    appFees?: { recipient: string; fee: number; }[];
    /**
     * OneClick route parameters
     */
    oneclickParams?: {
        /**
         * OneClick route bridge fee
         */
        appFees?: { recipient: string; fee: number; }[];
        /**
         * default is EXACT_INPUT
         */
        swapType?: "EXACT_INPUT" | "EXACT_OUTPUT";
        /**
         * Flag indicating whether use proxy contract to oneclick route
         * use proxy contract to oneclick route can fixed the transfer contract address
         * default is true
         */
        isProxy?: boolean;
    };
}

export const submitOneclickDepositTx = (
    requestBody: SubmitDepositTxRequest,
): CancelablePromise<SubmitDepositTxResponse> => {
    return __request(OpenAPI, {
        method: 'POST',
        url: '/v0/deposit/submit',
        body: requestBody,
        mediaType: 'application/json',
        errors: {
            400: `Bad Request - Invalid input data`,
            401: `Unauthorized - JWT token is invalid`,
        },
    });
}

export const submitOthersTx = (
    requestBody: {
        address: string;
        amount?: string;
        deposit_address: string;
        destination_domain_id?: number;
        fee?: string;
        project: "nearintents" | "layerzero" | "cctp";
        receive_address: string;
        source_domain_id?: number;
    },
): CancelablePromise<SubmitDepositTxResponse> => {
    return __request(OpenAPI, {
        method: 'POST',
        url: '/v0/trade/add',
        body: requestBody,
        mediaType: 'application/json',
        errors: {
            400: `Bad Request - Invalid input data`,
            401: `Unauthorized - JWT token is invalid`,
        },
    });
}

/**
 * StableFlow AI Service
 * Main service class for interacting with the StableFlow AI API
 */
export class SFA {
    /**
     * Get supported tokens
     * Retrieves a list of tokens currently supported by the StableFlow AI API for asset swaps.
     *
     * Each token entry includes its blockchain, contract address (if available), price in USD, and other metadata such as symbol and decimals.
     * @returns TokenResponse
     * @throws ApiError
     * @deprecated Please use the import { tokens } from 'stableflow-ai-sdk';
     */
    public static getTokens(): CancelablePromise<Array<TokenResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/tokens',
        });
    }

    /**
     * Request a swap quote
     * Generates a swap quote based on input parameters such as the assets, amount, slippage tolerance, and recipient/refund information.
     *
     * Returns pricing details, estimated time, and a unique **deposit address** to which tokens must be transferred to initiate the swap.
     *
     * You can set the `dry` parameter to `true` to simulate the quote request **without generating a deposit address** or initiating the swap process. This is useful for previewing swap parameters or validating input data without committing to an actual swap.
     *
     * This endpoint is the first required step in the swap process.
     * @param requestBody
     * @returns QuoteResponse
     * @throws ApiError
     * @deprecated Please use the getAllQuote
     */
    public static getQuote(
        requestBody: QuoteRequest,
    ): CancelablePromise<QuoteResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/quote',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request - Invalid input data`,
                401: `Unauthorized - JWT token is invalid`,
            },
        });
    }

    /**
     * Check swap execution status
     * Retrieves the current status of a swap using the unique deposit address from the quote, if quote response included deposit memo, it is required as well.
     *
     * The response includes the state of the swap (e.g., pending, processing, success, refunded) and any associated swap and transaction details.
     * @param depositAddress
     * @param depositMemo
     * @returns GetExecutionStatusResponse
     * @throws ApiError
     * @deprecated Please use the getStatus
     */
    public static getExecutionStatus(
        depositAddress: string,
        depositMemo?: string,
    ): CancelablePromise<GetExecutionStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/status',
            query: {
                'depositAddress': depositAddress,
                'depositMemo': depositMemo,
            },
            errors: {
                401: `Unauthorized - JWT token is invalid`,
                404: `Deposit address not found`,
            },
        });
    }

    /**
     * Submit deposit transaction hash
     * Optionally notifies the StableFlow AI service that a deposit has been sent to the specified address, using the blockchain transaction hash.
     * Only for Oneclick project
     *
     * This step can speed up swap processing by allowing the system to preemptively verify the deposit.
     * @param requestBody
     * @returns SubmitDepositTxResponse
     * @throws ApiError
     * @deprecated the send method will submit the tx hash automatically
     */
    public static submitDepositTx = submitOneclickDepositTx;

    /**
     * Get quotes from all available bridge services
     * Retrieves quotes from all supported bridge services (OneClick, CCTP, USDT0) in parallel.
     * Returns an array of quotes with their corresponding service types, allowing users to compare and select the best route.
     *
     * @param params Parameters for quote request including wallet, tokens, amount, etc.
     * @returns Promise resolving to an array of quote results with service type information
     * @throws Error if all bridge services fail or if required parameters are missing
     */
    public static async getAllQuote(params: GetAllQuoteParams): Promise<Array<{ serviceType: Service; quote?: any; error?: string }>> {
        const results: Array<{ serviceType: Service; quote?: any; error?: string }> = [];

        let { minInputAmount = "1", disabledServices } = params;
        if (Big(minInputAmount).lte(0)) {
            minInputAmount = "1";
        }

        if (
            !params.fromToken
            || !params.fromToken.contractAddress
            || !params.toToken
            || !params.toToken.contractAddress
            || !params.refundTo
            || !params.recipient
            || !params.amountWei
            || Big(params.amountWei).lte(minInputAmount)
        ) {
            throw new Error('Invalid parameters');
        }

        const formatQuoteParams = (service: Service) => {
            const _params: any = {
                dry: params.dry,
                amountWei: params.amountWei,
                refundTo: params.refundTo || "",
                recipient: params.recipient,
                wallet: params.wallet,
                fromToken: params.fromToken,
                toToken: params.toToken,
                prices: params.prices,
                slippageTolerance: params.slippageTolerance,
            };

            if (([
                Service.OneClick,
                Service.Usdt0OneClick,
                Service.OneClickUsdt0,
                Service.FraxZeroOneClick,
                Service.OneClickFraxZero,
            ] as Service[]).includes(service)) {
                _params.slippageTolerance = params.slippageTolerance * 100;
                _params.originAsset = params.fromToken.assetId;
                _params.destinationAsset = params.toToken.assetId;
                _params.refundType = "ORIGIN_CHAIN";
                _params.appFees = params.oneclickParams?.appFees || params.appFees;
                _params.swapType = params.oneclickParams?.swapType;
                _params.isProxy = params.oneclickParams?.isProxy;
            }
            if (([
                Service.Usdt0,
                Service.CCTP,
                Service.Usdt0OneClick,
                Service.OneClickUsdt0
            ] as Service[]).includes(service)) {
                _params.originChain = params.fromToken.chainName;
                _params.destinationChain = params.toToken.chainName;
            }
            return _params;
        };

        const fromToken = tokens.find(token => token.contractAddress.toLowerCase() === params.fromToken.contractAddress.toLowerCase());
        const toToken = tokens.find(token => token.contractAddress.toLowerCase() === params.toToken.contractAddress.toLowerCase());

        if (!fromToken || !toToken) {
            throw new Error('Token pair not supported');
        }

        const isFromUsdt = ["USDT", "USD₮0"].includes(fromToken.symbol);
        const isToUsdt = ["USDT", "USD₮0"].includes(toToken.symbol);

        const pushQuoteService = (_service: Service) => {
            const serviceStatus = getRouteStatus(_service, disabledServices);
            if (serviceStatus.disabled) {
                return;
            }
            const quoteParams = formatQuoteParams(_service);
            quoteServices.push({
                service: _service,
                quote: () => {
                    return ServiceMap[_service].quote(quoteParams);
                },
            });
        };

        const quoteServices: any = [];
        for (const serviceType of Object.values(Service)) {
            if (
                fromToken.services.includes(serviceType)
                && toToken.services.includes(serviceType)
            ) {
                pushQuoteService(serviceType);
            }
        }

        // If fromToken is usdt0 and toToken is usdc, Usdt0OneClick mode can be used
        if (
            fromToken.services.includes(Service.Usdt0)
            && toToken.services.includes(Service.OneClick)
            && fromToken.chainName !== "Arbitrum"
        ) {
            if (isFromUsdt && isToUsdt) {
                if (toToken.chainName !== "Arbitrum") {
                    pushQuoteService(Service.Usdt0OneClick);
                }
            } else {
                pushQuoteService(Service.Usdt0OneClick);
            }
        }

        // OneClickUsdt0 mode
        if (
            fromToken.services.includes(Service.OneClick)
            && toToken.services.includes(Service.Usdt0)
            && toToken.chainName !== "Arbitrum"
        ) {
            if (isFromUsdt && isToUsdt) {
                if (fromToken.chainName !== "Arbitrum") {
                    pushQuoteService(Service.OneClickUsdt0);
                }
            } else {
                pushQuoteService(Service.OneClickUsdt0);
            }
        }

        // FraxZeroOneClick mode
        if (
            fromToken.services.includes(Service.FraxZero)
            && toToken.services.includes(Service.OneClick)
        ) {
            pushQuoteService(Service.FraxZeroOneClick);
        }

        // OneClickFraxZero mode
        if (
            fromToken.services.includes(Service.OneClick)
            && toToken.services.includes(Service.FraxZero)
        ) {
            pushQuoteService(Service.OneClickFraxZero);
        }

        if (params.singleService) {
            const quoteService = quoteServices.find((service: any) => service.service === params.singleService);
            if (quoteService) {
                try {
                    const quoteRes = await quoteService.quote();
                    results.push({
                        serviceType: quoteService.service,
                        quote: quoteRes,
                    });
                } catch (error) {
                    const _err = formatQuoteError(error, { service: quoteService.service, fromToken });
                    results.push(_err);
                }
            }
            return results;
        }

        const promises: Promise<void>[] = [];
        for (const quoteService of quoteServices) {
            const promise = (async () => {
                try {
                    const quoteRes = await quoteService.quote();
                    results.push({
                        serviceType: quoteService.service,
                        quote: quoteRes,
                    });
                } catch (error) {
                    console.log("%s quote failed: %o", quoteService.service, error);
                    const _err = formatQuoteError(error, { service: quoteService.service, fromToken });
                    results.push(_err);
                }
            })();
            promises.push(promise);
        }
        await Promise.allSettled(promises);
        return results;
    }

    /**
     * Send transaction for the selected bridge route
     * Executes the transaction using the specified bridge service based on the service type.
     *
     * @param serviceType The type of bridge service to use (oneclick, cctp, or usdt0)
     * @param params Parameters for sending the transaction including wallet, tokens, deposit address, etc.
     * @returns Promise resolving to the transaction hash or signature
     * @throws Error if the service type is invalid or if the transaction fails
     */
    public static async send(
        serviceType: Service,
        params: {
            wallet: any;
            quote: any;
        }
    ): Promise<string> {
        const service = ServiceMap[serviceType];
        if (!service) {
            throw new Error(`Invalid service type: ${serviceType}`);
        }

        if (!service.send) {
            throw new Error(`Service ${serviceType} does not support send method`);
        }

        const sendParams: any = {
            wallet: params.wallet,
        };

        if (serviceType === Service.OneClick) {
            sendParams.sendParam = params.quote?.sendParam;
            sendParams.fromToken = params.quote?.quoteParam.fromToken;
            sendParams.depositAddress = params.quote?.depositAddress;
            sendParams.amountWei = params.quote?.quoteParam?.amountWei;
        }
        if (serviceType === Service.Usdt0) {
            for (const key in params.quote?.sendParam) {
                sendParams[key] = params.quote?.sendParam[key];
            }
        }
        if (serviceType === Service.CCTP) {
            for (const key in params.quote?.sendParam) {
                sendParams[key] = params.quote?.sendParam[key];
            }
        }

        const txhash = await service.send(sendParams);

        try {
            const reportParams: any = {
                project: ServiceBackend[serviceType] as any,
                address: params.quote?.quoteParam?.refundTo,
                receive_address: params.quote?.quoteParam?.recipient,
                amount: Big(params.quote?.quoteParam?.amountWei || 0).div(10 ** (params.quote?.fromToken?.decimals || 6)).toFixed(params.quote?.fromToken?.decimals || 6, 0),
            };
            if (serviceType === Service.OneClick) {
                reportParams.deposit_address = params.quote?.quote?.depositAddress;
            }
            if (serviceType === Service.Usdt0) {
                reportParams.tx_hash = txhash;
            }
            if (serviceType === Service.CCTP) {
                reportParams.tx_hash = txhash;
                reportParams.fee = params.quote?.fees?.estimateMintGasUsd;
                reportParams.destination_domain_id = params.quote?.quoteParam?.destinationDomain;
                reportParams.source_domain_id = params.quote?.quoteParam?.sourceDomain;
            }
            submitOthersTx(reportParams);
        } catch (error) {
            console.log("%cReport tx failed: %o", "background:#f00;color:#fff;", error);
        }

        return txhash;
    }

    /**
     * Get transaction status for the selected bridge route
     * Queries the transaction status from the specified bridge service.
     *
     * @param serviceType The type of bridge service used (oneclick, cctp, or usdt0)
     * @param params Parameters for querying status including deposit address, transaction hash, etc.
     * @returns Promise resolving to the transaction status response
     * @throws Error if the service type is invalid or if the status query fails
     */
    public static async getStatus(
        serviceType: Service,
        params: {
            depositAddress?: string;
            hash?: string;
        }
    ): Promise<{ status: TransactionStatus; toChainTxHash?: string; }> {
        const service = ServiceMap[serviceType];
        if (!service) {
            throw new Error(`Invalid service type: ${serviceType}`);
        }

        if (!service.getStatus) {
            throw new Error(`Service ${serviceType} does not support getStatus method`);
        }

        const result: { status: TransactionStatus; toChainTxHash?: string; } = { status: TransactionStatus.Pending };
        const response = await service.getStatus(params);

        if (serviceType === Service.OneClick) {
            // KNOWN_DEPOSIT_TX | PENDING_DEPOSIT | INCOMPLETE_DEPOSIT | PROCESSING | SUCCESS | REFUNDED | FAILED
            const status = response.status;

            if (status === "SUCCESS") {
                result.status = TransactionStatus.Success;
                result.toChainTxHash = response.swapDetails?.destinationChainTxHashes?.[0]?.hash;
            }

            if (status === "REFUNDED" || status === "FAILED") {
                result.status = TransactionStatus.Failed;
            }
        }

        if (serviceType === Service.Usdt0) {
            const _result = response.data[0];
            // INFLIGHT | CONFIRMING | DELIVERED | BLOCKED | FAILED
            const status = _result.status.name;
            if (status === "DELIVERED") {
                result.status = TransactionStatus.Success;
                result.toChainTxHash = _result.destination?.tx?.txHash;
            }
            if (status === "FAILED" || status === "BLOCKED") {
                result.status = TransactionStatus.Failed;
            }
        }

        if (serviceType === Service.CCTP) {
            const _result = response.data;
            const status = _result.status;
            // success
            if (status === 1) {
                result.status = TransactionStatus.Success;
                result.toChainTxHash = _result.to_tx_hash;
            }
            // Expired
            if (status === 2) {
                result.status = TransactionStatus.Failed;
            }
        }

        return result;
    }
}

