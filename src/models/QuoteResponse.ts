/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
import type { Quote } from './Quote';
import type { QuoteRequest } from './QuoteRequest';
export type QuoteResponse = {
    /**
     * Timestamp in ISO format that was used to derive the deposit address
     */
    timestamp: string;
    /**
     * Signature of the StableFlow service confirming the quote for the specific deposit address. Must be saved on the client side (along with the whole quote) in order to resolve any disputes or mistakes.
     */
    signature: string;
    /**
     * User request
     */
    quoteRequest: QuoteRequest;
    /**
     * Response containing the deposit address for sending the `amount` of `originAsset` and the expected output amount.
     */
    quote: Quote;
};

