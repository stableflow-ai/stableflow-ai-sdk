/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
export type AppFee = {
    /**
     * Account ID within Intents to which this fee will be transferred
     */
    recipient: string;
    /**
     * Fee for this recipient as part of amountIn in basis points (1/100th of a percent), e.g. 100 for 1% fee
     */
    fee: number;
};

