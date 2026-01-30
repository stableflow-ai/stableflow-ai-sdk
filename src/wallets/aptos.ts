import { Aptos, AptosConfig, Network, parseTypeTag, TypeTagAddress, TypeTagU64, type EntryFunctionABI } from "@aptos-labs/ts-sdk";
import Big from "big.js";
import { Service, type ServiceType } from "../core/Service";
import { getPrice } from "../utils/price";
import { numberRemoveEndZero } from "../utils/number";
import { SendType } from "../core/Send";
import { getRpcUrls } from "./config/rpcs";

export default class AptosWallet {
  connection: any;
  private account: any | null;
  private aptos: Aptos;
  private signAndSubmitTransaction: any;

  constructor(options: { account: any | null; signAndSubmitTransaction: any; }) {
    const config = new AptosConfig({
      network: Network.MAINNET,
      fullnode: getRpcUrls("aptos")[0],
    });
    const aptos = new Aptos(config);

    this.aptos = aptos;
    this.signAndSubmitTransaction = options.signAndSubmitTransaction;
    this.account = options.account;
  }

  // Transfer APT
  async transferAPT(to: string, amount: string): Promise<string> {
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    try {
      // Convert amount to octas (1 APT = 10^8 octas)
      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);

      // Sign and submit transaction
      const result = await this.signAndSubmitTransaction({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [to, amountInOctas.toString()],
        },
      });

      const executedTransaction = await this.aptos.waitForTransaction({ transactionHash: typeof result === "string" ? result : result.hash });
      if (executedTransaction.success !== true) {
        console.log("Transfer APT token failed: %o", executedTransaction);
        throw new Error("Transfer token failed");
      }

      return typeof result === "string" ? result : result.hash;
    } catch (error) {
      console.log("Transfer APT failed:", error);
      throw error;
    }
  }

  // Transfer Fungible Asset token
  async transferToken(contractAddress: string, to: string, amount: string): Promise<string> {
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.signAndSubmitTransaction({
        data: {
          function: "0x1::primary_fungible_store::transfer",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [contractAddress, to, amount],
          abi: faTransferAbi,
        },
      });

      const executedTransaction = await this.aptos.waitForTransaction({ transactionHash: typeof result === "string" ? result : result.hash });
      if (executedTransaction.success !== true) {
        console.log("Transfer token failed: %o", executedTransaction);
        throw new Error("Transfer token failed");
      }

      return typeof result === "string" ? result : result.hash;
    } catch (error) {
      console.log("Transfer token failed:", error);
      throw error;
    }
  }

  // Generic transfer method
  async transfer(data: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }): Promise<string> {
    const { originAsset, depositAddress, amount } = data;

    // Transfer APT
    if (originAsset === "APT" || originAsset === "apt") {
      return await this.transferAPT(depositAddress, amount);
    }

    // Transfer SPL token
    const result = await this.transferToken(
      originAsset,
      depositAddress,
      amount
    );
    return result;
  }

  async getAPTBalance(account: string) {
    try {
      const accountAPTAmount = await this.aptos.getAccountAPTAmount({
        accountAddress: account,
      });
      return accountAPTAmount.toString();
    } catch (error) {
      console.log("Get APT balance failed:", error);
      return "0";
    }
  }

  async getTokenBalance(contractAddress: string, account: string) {
    try {
      const balance = await this.aptos.getBalance({
        accountAddress: account,
        asset: contractAddress,
      });
      return balance.toString();
    } catch (error) {
      console.log("Get token balance failed:", error);
      return "0";
    }
  }

  async getBalance(token: any, account: string) {
    if (token.symbol === "APT" || token.symbol === "apt" || token.symbol === "native") {
      return await this.getAPTBalance(account);
    }
    return await this.getTokenBalance(token.contractAddress, account);
  }

  async balanceOf(token: any, account: string) {
    return await this.getBalance(token, account);
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
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    const { originAsset, depositAddress, amount } = data;
    const isOriginNative = originAsset === "APT" || originAsset === "apt";
    const sender = this.account?.address?.toString();

    if (!sender) {
      throw new Error("Invalid sender address");
    }

    // Get signer public key for simulation
    // The account object from wallet adapter should have publicKey or we can derive it from address
    let signerPublicKey: any;
    if (this.account.publicKey) {
      signerPublicKey = this.account.publicKey;
    } else if (this.account.address) {
      // If publicKey is not available, we can use the address as PublicKey for simulation
      // Aptos SDK can handle this in some cases, but ideally we need the actual public key
      signerPublicKey = this.account.address;
    } else {
      throw new Error("Unable to get signer public key");
    }

    // For simulation, we might need to use a smaller amount if balance is insufficient
    // First try with the actual amount, if it fails due to insufficient balance, use a minimal amount
    let simulationAmount = amount;
    let useMinimalAmount = false;

    try {
      // Check balance first for APT transfers
      if (isOriginNative) {
        try {
          const balance = await this.aptos.getAccountAPTAmount({
            accountAddress: sender,
          });
          const amountBigInt = BigInt(amount);
          // If amount exceeds balance, use a minimal amount for estimation (1 octa)
          if (amountBigInt > balance) {
            simulationAmount = "1";
            useMinimalAmount = true;
          }
        } catch (error) {
          // If balance check fails, try with minimal amount
          simulationAmount = "1";
          useMinimalAmount = true;
        }
      }
    } catch (error) {
      // If check fails, proceed with original amount
    }

    let rawTxn;
    if (isOriginNative) {
      // For APT, ensure amount is in octas (smallest unit)
      // If amount might be in APT units, convert it, but typically it's already in octas
      rawTxn = await this.aptos.transaction.build.simple({
        sender,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [depositAddress, simulationAmount],
        },
      });
    } else {
      rawTxn = await this.aptos.transaction.build.simple({
        sender,
        data: {
          function: "0x1::primary_fungible_store::transfer",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [originAsset, depositAddress, simulationAmount],
        },
      });
    }

    let simulation: any;
    try {
      const simulationResult = await this.aptos.transaction.simulate.simple({
        signerPublicKey,
        transaction: rawTxn,
        options: {
          estimateGasUnitPrice: true,
          estimateMaxGasAmount: true,
          estimatePrioritizedGasUnitPrice: true,
        },
      });
      simulation = simulationResult[0];
    } catch (error: any) {
      // If simulation fails with insufficient balance and we haven't tried minimal amount, retry
      if (!useMinimalAmount && (error.message?.includes("INSUFFICIENT_BALANCE") || error.message?.includes("EINSUFFICIENT_BALANCE"))) {
        simulationAmount = isOriginNative ? "1" : "1";
        // Rebuild transaction with minimal amount
        if (isOriginNative) {
          rawTxn = await this.aptos.transaction.build.simple({
            sender,
            data: {
              function: "0x1::coin::transfer",
              typeArguments: ["0x1::aptos_coin::AptosCoin"],
              functionArguments: [depositAddress, simulationAmount],
            },
          });
        } else {
          rawTxn = await this.aptos.transaction.build.simple({
            sender,
            data: {
              function: "0x1::primary_fungible_store::transfer",
              typeArguments: ["0x1::fungible_asset::Metadata"],
              functionArguments: [originAsset, depositAddress, simulationAmount],
            },
          });
        }

        const simulationResult = await this.aptos.transaction.simulate.simple({
          signerPublicKey,
          transaction: rawTxn,
          options: {
            estimateGasUnitPrice: true,
            estimateMaxGasAmount: true,
            estimatePrioritizedGasUnitPrice: true,
          },
        });
        simulation = simulationResult[0];
      } else {
        throw error;
      }
    }

    if (!simulation.success) {
      // If simulation still fails, return default values
      const defaultGasLimit = isOriginNative ? 2400n : 6000n; // 2000 * 1.2 or 5000 * 1.2
      const defaultGasPrice = 100n; // 100 octas per gas unit
      const defaultEstimateGas = defaultGasLimit * defaultGasPrice;

      console.warn(`Simulation failed: ${simulation.vm_status}, using default gas estimates`);
      return {
        gasLimit: defaultGasLimit,
        gasPrice: defaultGasPrice,
        estimateGas: defaultEstimateGas,
      };
    }

    const gasUsed = BigInt(simulation.gas_used || 0);
    const gasLimit = (gasUsed * 150n) / 100n;

    const gasPrice = BigInt(simulation.gas_unit_price || 100);

    const estimateGas = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimateGas,
    };
  }

  async checkTransactionStatus(signature: string) {
    try {
      // Get transaction by hash
      const transaction = await this.aptos.getTransactionByHash({
        transactionHash: signature,
      });

      if (!transaction) {
        return false;
      }

      // Check if transaction is successful by checking the success field
      // The transaction object should have a success property or we can check the status
      return (transaction as any).success === true || (transaction as any).status === "success";
    } catch (error) {
      console.log("Check transaction status failed:", error);
      return false;
    }
  }

  async quoteOneClickProxy(params: any) {
    const {
      proxyAddress,
      fromToken,
      depositAddress,
      amountWei,
      prices,
    } = params;

    const result: any = { fees: {} };

    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    if (!depositAddress) {
      throw new Error("depositAddress is required");
    }

    try {
      const sender = this.account?.address?.toString();
      if (!sender) {
        throw new Error("Invalid sender address");
      }

      // Get signer public key for simulation
      let signerPublicKey: any;
      if (this.account.publicKey) {
        signerPublicKey = this.account.publicKey;
      } else if (this.account.address) {
        signerPublicKey = this.account.address;
      } else {
        throw new Error("Unable to get signer public key");
      }

      const typeArgument = `0x1::fungible_asset::Metadata`;

      // const functionId = `${proxyAddress}::stableflow_proxy::proxy_transfer` as `${string}::${string}::${string}`;
      const functionId = `${proxyAddress}::stableflow_proxy::proxy_transfer_fa` as `${string}::${string}::${string}`;
      const functionArguments = [fromToken.contractAddress, depositAddress, amountWei];

      const rawTxn = await this.aptos.transaction.build.simple({
        sender,
        data: {
          function: functionId,
          typeArguments: [typeArgument],
          functionArguments: functionArguments,
        },
      });

      // Simulate transaction to estimate gas
      let simulation: any;
      try {
        const simulationResult = await this.aptos.transaction.simulate.simple({
          signerPublicKey,
          transaction: rawTxn,
          options: {
            estimateGasUnitPrice: true,
            estimateMaxGasAmount: true,
            estimatePrioritizedGasUnitPrice: true,
          },
        });
        simulation = simulationResult[0];
      } catch (error: any) {
        console.log("oneclick proxy simulation failed: %o", error);
        // Use default gas estimation if simulation fails
        const defaultGasLimit = 5000n;
        const defaultGasPrice = 100n;
        const defaultEstimateGas = defaultGasLimit * defaultGasPrice;

        const estimateGasUsd = Big(defaultEstimateGas.toString())
          .div(10 ** fromToken.nativeToken.decimals)
          .times(getPrice(prices, fromToken.nativeToken.symbol));

        result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
        result.estimateSourceGas = defaultEstimateGas.toString();
        result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));

        // Set sendParam for transaction
        result.sendParam = {
          function: functionId,
          typeArguments: [typeArgument],
          functionArguments: functionArguments,
        };

        return result;
      }

      if (!simulation.success) {
        console.warn(`Simulation failed: ${simulation.vm_status}, using default gas estimates`);
        const defaultGasLimit = 5000n;
        const defaultGasPrice = 100n;
        const defaultEstimateGas = defaultGasLimit * defaultGasPrice;

        const estimateGasUsd = Big(defaultEstimateGas.toString())
          .div(10 ** fromToken.nativeToken.decimals)
          .times(getPrice(prices, fromToken.nativeToken.symbol));

        result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
        result.estimateSourceGas = defaultEstimateGas.toString();
        result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));

        result.sendParam = {
          function: functionId,
          typeArguments: [typeArgument],
          functionArguments: functionArguments,
        };

        return result;
      }

      // Calculate gas fees from simulation
      const gasUsed = BigInt(simulation.gas_used || 0);
      const gasLimit = (gasUsed * 150n) / 100n; // Add 50% buffer
      const gasPrice = BigInt(simulation.gas_unit_price || 100);
      const estimateGas = gasLimit * gasPrice;

      // Convert to USD
      const estimateGasUsd = Big(estimateGas.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .times(getPrice(prices, fromToken.nativeToken.symbol));

      result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
      result.estimateSourceGas = estimateGas.toString();
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));

      // Set sendParam for transaction
      result.sendParam = {
        function: functionId,
        typeArguments: [typeArgument],
        functionArguments: functionArguments,
      };

    } catch (error) {
      console.log("oneclick quote proxy failed: %o", error);
      // Return default values on error
      const defaultGasLimit = 5000n;
      const defaultGasPrice = 100n;
      const defaultEstimateGas = defaultGasLimit * defaultGasPrice;

      const estimateGasUsd = Big(defaultEstimateGas.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .times(getPrice(prices, fromToken.nativeToken.symbol));

      result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
      result.estimateSourceGas = defaultEstimateGas.toString();
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(estimateGasUsd).toFixed(20));
    }

    return result;
  }

  async sendTransaction(params: any) {
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    const { function: functionId, typeArguments, functionArguments } = params;

    if (!functionId || !typeArguments || !functionArguments) {
      throw new Error("Invalid sendParam: function, typeArguments, and functionArguments are required");
    }

    try {
      const sender = this.account?.address?.toString();
      if (!sender) {
        throw new Error("Invalid sender address");
      }

      const result = await this.signAndSubmitTransaction({
        data: {
          function: functionId as `${string}::${string}::${string}`,
          typeArguments,
          functionArguments,
        },
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: typeof result === "string" ? result : result.hash
      });

      if (executedTransaction.success !== true) {
        console.log("Proxy transfer failed: %o", executedTransaction);
        throw new Error("Proxy transfer failed");
      }

      return typeof result === "string" ? result : result.hash;
    } catch (error) {
      console.log("Send transaction failed:", error);
      throw error;
    }
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
   * @param type Send type from SendTypeSENDm
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

export { AptosWallet };

const faTransferAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [] }],
  parameters: [parseTypeTag("0x1::object::Object"), new TypeTagAddress(), new TypeTagU64()],
};
