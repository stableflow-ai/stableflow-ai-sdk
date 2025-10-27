/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
import type { QuoteResponse } from './QuoteResponse';
import type { SwapDetails } from './SwapDetails';
export type GetExecutionStatusResponse = {
    /**
     * Quote response from the original request
     */
    quoteResponse: QuoteResponse;
    status: GetExecutionStatusResponse.status;
    /**
     * Last time the state was updated
     */
    updatedAt: string;
    /**
     * Details of actual swaps and withdrawals
     */
    swapDetails: SwapDetails;
};
export namespace GetExecutionStatusResponse {
    export enum status {
        KNOWN_DEPOSIT_TX = 'KNOWN_DEPOSIT_TX',
        PENDING_DEPOSIT = 'PENDING_DEPOSIT',
        INCOMPLETE_DEPOSIT = 'INCOMPLETE_DEPOSIT',
        PROCESSING = 'PROCESSING',
        SUCCESS = 'SUCCESS',
        REFUNDED = 'REFUNDED',
        FAILED = 'FAILED',
    }
}

