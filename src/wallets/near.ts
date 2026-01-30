import { Buffer } from "buffer";
import Big from "big.js";
import { getPrice } from "../utils/price";
import { numberRemoveEndZero } from "../utils/number";
import { SendType } from "../core/Send";
import { Service, type ServiceType } from "../core/Service";
import { getRpcUrls } from "./config/rpcs";

export default class NearWallet {
  private selector: any;
  private rpcUrl: string;
  constructor(_selector: any) {
    this.selector = _selector;
    this.rpcUrl = getRpcUrls("near")[0];
  }

  private async query(contractId: string, methodName: string, args: any = {}) {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: contractId,
          method_name: methodName,
          args_base64: Buffer.from(JSON.stringify(args)).toString("base64")
        }
      })
    });
    const result = await response.json();
    if (result.result && result.result.result) {
      return JSON.parse(Buffer.from(result.result.result).toString());
    }
    return result;
  }

  async transfer(data: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }) {
    const wallet = await this.selector.wallet();
    const checkStorage = await this.query(
      data.originAsset,
      "storage_balance_of",
      {
        account_id: data.depositAddress
      }
    );
    const transactions = [];
    if (!checkStorage?.available) {
      transactions.push({
        receiverId: data.originAsset,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: data.depositAddress,
                registration_only: true
              },
              gas: "15000000000000",
              deposit: "1250000000000000000000"
            }
          }
        ]
      });
    }
    transactions.push({
      receiverId: data.originAsset,
      actions: [
        {
          type: "FunctionCall" as const,
          params: {
            methodName: "ft_transfer",
            args: {
              receiver_id: data.depositAddress,
              amount: data.amount,
              memo: null
            },
            gas: "30000000000000",
            deposit: "1"
          }
        }
      ]
    });

    const result = await wallet.signAndSendTransactions({
      transactions,
      callbackUrl: "/"
    });

    if (result.slice(-1).length) {
      return result.slice(-1)[0].transaction.hash;
    }

    return "";
  }

  async getBalance(token: any, _account: string) {
    if (token.symbol === "near" || token.symbol === "NEAR" || token.symbol === "native") {
      return this.getNearBalance(_account);
    }
    const balance = await this.query(token.contractAddress, "ft_balance_of", {
      account_id: _account
    });
    return balance || "0";
  }

  async balanceOf(token: any, account: string) {
    return await this.getBalance(token, account);
  }

  /**
   * Get native NEAR balance
   * @param account Account ID
   * @returns NEAR balance in yoctoNEAR (smallest unit)
   */
  async getNearBalance(account: string): Promise<string> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "query",
          params: {
            request_type: "view_account",
            finality: "final",
            account_id: account
          }
        })
      });
      const result = await response.json();
      return result.result?.amount || "0";
    } catch (error) {
      console.error("Failed to get NEAR balance:", error);
      return "0";
    }
  }

  /**
   * Estimate gas limit for transfer transaction
   * @param data Transfer data
   * @returns Gas limit estimate, gas price, and estimated gas cost
   */
  async estimateTransferGas(data: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }): Promise<{
    gasLimit: bigint;
    gasPrice: bigint;
    estimateGas: bigint;
  }> {
    const { originAsset, depositAddress } = data;

    // Check if storage deposit is needed
    const checkStorage = await this.query(
      originAsset,
      "storage_balance_of",
      {
        account_id: depositAddress
      }
    );

    let gasLimit: bigint;

    if (!checkStorage?.available) {
      // Storage deposit: 15000000000000 gas
      // ft_transfer: 30000000000000 gas
      gasLimit = BigInt("15000000000000") + BigInt("30000000000000");
    } else {
      // Only ft_transfer needed: 30000000000000 gas
      gasLimit = BigInt("30000000000000");
    }

    // Increase by 20% to provide buffer
    gasLimit = (gasLimit * 120n) / 100n;

    // NEAR gas price is typically 100000000 yoctoNEAR per gas unit
    const gasPrice = BigInt("100000000");

    // Calculate estimated gas cost: gasLimit * gasPrice
    const estimateGas = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimateGas
    };
  }

  async checkTransactionStatus(txHash: string) {
    const wallet = await this.selector.wallet();
    const accounts = await wallet.getAccounts();
    const accountId = accounts[0]?.accountId;

    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "EXPERIMENTAL_tx_status",
          params: {
            tx_hash: txHash,
            sender_account_id: accountId,
            wait_until: "EXECUTED" // wait_until: "NONE" | "EXECUTED_OPTIMISTIC" | "EXECUTED"
          }
        })
      });
      const txStatus = await response.json();
      console.log("fetch rpc success: %o", txStatus);
      console.log("fetch rpc status success: %o", typeof txStatus.result?.status?.SuccessValue !== "undefined");
    } catch (error) {
      console.log("fetch rpc failed: %o", error);
    }
  }

  async quoteOneClickProxy(params: any) {
    const {
      proxyAddress,
      fromToken,
      refundTo,
      depositAddress,
      amountWei,
      prices,
    } = params;

    const result: any = { fees: {} };

    try {
      const wallet = await this.selector.wallet();
      const accounts = await wallet.getAccounts();
      const userAccountId = refundTo || accounts[0]?.accountId;

      if (!userAccountId) {
        throw new Error("No account found");
      }

      const tokenContract = fromToken.contractAddress;
      // proxyAddress should be stableflowstg.near, use default if not provided
      const STABLEFLOW_CONTRACT = proxyAddress || "stableflowstg.near";

      if (!depositAddress) {
        throw new Error("depositAddress is required");
      }

      // Check and register token: register for intents address (depositAddress) and stableflowstg.near contract
      const transactions: any[] = [];

      // Check if depositAddress (intents address) is registered
      const checkStorageDepositAddress = await this.query(
        tokenContract,
        "storage_balance_of",
        {
          account_id: depositAddress
        }
      );

      if (!checkStorageDepositAddress?.available) {
        transactions.push({
          receiverId: tokenContract,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {
                  account_id: depositAddress,
                  registration_only: true
                },
                gas: "15000000000000",
                deposit: "1250000000000000000000"
              }
            }
          ]
        });
      }

      // Check if stableflowstg.near is registered
      const checkStorageStableflow = await this.query(
        tokenContract,
        "storage_balance_of",
        {
          account_id: STABLEFLOW_CONTRACT
        }
      );

      if (!checkStorageStableflow?.available) {
        transactions.push({
          receiverId: tokenContract,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {
                  account_id: STABLEFLOW_CONTRACT,
                  registration_only: true
                },
                gas: "15000000000000",
                deposit: "1250000000000000000000"
              }
            }
          ]
        });
      }

      // Build ft_transfer_call transaction
      transactions.push({
        receiverId: tokenContract,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: STABLEFLOW_CONTRACT,
                amount: amountWei,
                msg: depositAddress
              },
              gas: "50000000000000", // ft_transfer_call requires more gas
              deposit: "1"
            }
          }
        ]
      });

      // Calculate gas fees
      let totalGasLimit = BigInt("50000000000000"); // ft_transfer_call gas
      if (!checkStorageDepositAddress?.available) {
        totalGasLimit += BigInt("15000000000000"); // storage_deposit gas
      }
      if (!checkStorageStableflow?.available) {
        totalGasLimit += BigInt("15000000000000"); // storage_deposit gas
      }

      // Add 20% buffer
      totalGasLimit = (totalGasLimit * 120n) / 100n;

      // NEAR gas price: 100000000 yoctoNEAR per gas unit
      const gasPrice = BigInt("100000000");
      const estimateGas = totalGasLimit * gasPrice;

      // Calculate USD fees
      const estimateGasUsd = Big(estimateGas.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .times(getPrice(prices, fromToken.nativeToken.symbol));

      result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
      result.estimateSourceGas = estimateGas.toString();
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));

      // Set sendParam for subsequent transaction sending
      result.sendParam = {
        transactions,
        callbackUrl: "/"
      };

    } catch (error) {
      console.log("oneclick quote proxy failed: %o", error);
      // Use default gas estimation
      const defaultGasLimit = BigInt("80000000000000"); // default gas limit
      const gasPrice = BigInt("100000000");
      const estimateGas = defaultGasLimit * gasPrice;
      const estimateGasUsd = Big(estimateGas.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .times(getPrice(prices, fromToken.nativeToken.symbol));

      result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
      result.estimateSourceGas = estimateGas.toString();
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
    }

    return result;
  }

  async sendTransaction(params: any) {
    const { transactions, callbackUrl } = params;

    if (!transactions || !Array.isArray(transactions)) {
      throw new Error("Invalid sendParam: transactions array is required");
    }

    const wallet = await this.selector.wallet();
    const result = await wallet.signAndSendTransactions({
      transactions,
      callbackUrl: callbackUrl || "/"
    });

    if (result.slice(-1).length) {
      return result.slice(-1)[0].transaction.hash;
    }

    return "";
  }

  /**
   * Unified quote method that routes to specific quote methods based on type
   * @param type Service type from ServiceType
   * @param params Parameters for the quote
   */
  async quote(type: ServiceType, params: any) {
    switch (type) {
      case Service.OneClick:
        return await this.quoteOneClickProxy(params);
      default:
        throw new Error(`Unsupported quote type: ${type}`);
    }
  }

  /**
   * Unified send method that routes to specific send methods based on type
   * @param type Send type from SendType enum
   * @param params Parameters for the send transaction
   */
  async send(type: SendType, params: any) {
    switch (type) {
      case SendType.SEND:
        return await this.sendTransaction(params);
      case SendType.TRANSFER:
        return await this.transfer(params);
      default:
        throw new Error(`Unsupported send type: ${type}`);
    }
  }
}

export { NearWallet };
