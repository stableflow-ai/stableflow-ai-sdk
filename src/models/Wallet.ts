import { SendType } from "../core/Send";
import { ServiceType } from "../core/Service";
import { TokenConfig } from "./Token";

export interface WalletConfig {
  transfer(params: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }): Promise<string>;

  getBalance(token: TokenConfig, account: string): Promise<string>;

  balanceOf(token: TokenConfig, account: string): Promise<string>;

  allowance?(params: {
    contractAddress: string;
    spender: string;
    address: string;
    amountWei: string | number | BigInt;
  }): Promise<{ allowance: string; needApprove: boolean; }>;

  approve?(params: {
    contractAddress: string;
    spender: string;
    amountWei: string | number | BigInt;
    isApproveMax?: boolean;
  }): Promise<boolean>;

  quote(
    type: ServiceType,
    params: {}
  ): Promise<{
    needApprove?: boolean;
    approveSpender?: string;
    sendParam?: any;
    quoteParam: any;
    fees?: Record<string, string>;
    totalFeesUsd?: string;
    estimateSourceGas?: BigInt;
    estimateSourceGasUsd?: string;
    estimateTime?: number;
    outputAmount?: string;
  }>;

  send(type: SendType, params: any): Promise<string>;
}