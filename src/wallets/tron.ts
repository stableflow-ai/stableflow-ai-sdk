import { addressToBytes32 } from "../utils/address";
import { numberRemoveEndZero } from "../utils/number";
import { getPrice } from "../utils/price";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { ethers } from "ethers";
import Big from "big.js";
import { TronWeb } from "tronweb";
import { SendType } from "../core/Send";
import { Service, type ServiceType } from "../core/Service";
import { DefaultAddresses } from "./config/addresses";
import { getRpcUrls } from "./config/rpcs";
import { getDestinationAssociatedTokenAddress } from "./utils/solana";
import { getHopMsgFee } from "../bridges/usdt0/hop-composer";
import { DATA_HEX_PROTOBUF_EXTRA, LZ_RECEIVE_VALUE, SIGNATURE_SIZE, USDT0_LEGACY_MESH_TRANSFTER_FEE } from "../bridges/usdt0/config";

const DefaultTronWalletAddress = DefaultAddresses["tron"];
const customTronWeb = new TronWeb({
  fullHost: getRpcUrls("tron")[0],
  headers: {},
  privateKey: "",
});

export default class TronWallet {
  private signAndSendTransaction: any;
  private address: string;
  private tronWeb: any;

  constructor(options: any) {
    this.signAndSendTransaction = options.signAndSendTransaction;
    this.address = options.address;

    customTronWeb.setAddress(this.address || DefaultTronWalletAddress);
    this.tronWeb = customTronWeb;
  }

  async waitForTronWeb() {
    return new Promise((resolve) => {
      if (this.tronWeb) {
        const address = this.tronWeb.defaultAddress.base58 || DefaultTronWalletAddress;
        customTronWeb.setAddress(address);
        this.tronWeb = customTronWeb;
        resolve(this.tronWeb);
        return;
      }

      const checkTronWeb = () => {
        if ((window as any).tronWeb) {
          this.tronWeb = (window as any).tronWeb;
          const address = this.tronWeb.defaultAddress.base58 || DefaultTronWalletAddress;
          customTronWeb.setAddress(address);
          this.tronWeb = customTronWeb;
          resolve(this.tronWeb);
        } else {
          setTimeout(checkTronWeb, 100);
        }
      };

      checkTronWeb();

      setTimeout(() => {
        customTronWeb.setAddress(DefaultTronWalletAddress);
        this.tronWeb = customTronWeb;
        resolve(this.tronWeb);
        console.log(new Error("TronWeb initialization timeout"));
      }, 10000);
    });
  }

  async transfer(data: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }) {
    const { originAsset, depositAddress, amount } = data;

    await this.waitForTronWeb();

    if (originAsset === "TRX" || originAsset === "trx") {
      return await this.transferTRX(depositAddress, amount);
    }

    // Transfer TRC20 token (USDT, USDC, etc.)
    return await this.transferToken(originAsset, depositAddress, amount);
  }

  async transferTRX(to: string, amount: string) {
    await this.waitForTronWeb();

    const transaction = await this.tronWeb.transactionBuilder.sendTrx(
      to,
      this.tronWeb.toSun(amount)
    );

    const result = await this.signAndSendTransaction(transaction);

    if (typeof result === "string") {
      return result;
    }

    return result.txid;
  }

  async transferToken(contractAddress: string, to: string, amount: string) {
    await this.waitForTronWeb();

    const functionSelector = 'transfer(address,uint256)';
    const parameter = [{ type: 'address', value: to }, { type: 'uint256', value: amount }];
    const tx = await this.tronWeb.transactionBuilder.triggerSmartContract(contractAddress, functionSelector, {}, parameter);

    const result = await this.signAndSendTransaction(tx.transaction);

    if (typeof result === "string") {
      return result;
    }

    return result.txid;

    // // Get contract instance
    // const contract = await this.tronWeb.contract().at(contractAddress);

    // // Call transfer function
    // const transaction = await contract.transfer(to, amount).send({
    //   feeLimit: 100_000_000
    // });

    // return transaction;
  }

  async getBalance(token: any, account: string) {
    await this.waitForTronWeb();

    if (token.symbol === "TRX" || token.symbol === "trx" || token.symbol === "native") {
      return await this.getTRXBalance(account);
    }

    return await this.getTokenBalance(token.contractAddress, account);
  }

  async getTRXBalance(account: string) {
    await this.waitForTronWeb();

    const balance = await this.tronWeb.trx.getBalance(account);
    return balance.toString();
  }

  async getTokenBalance(contractAddress: string, account: string) {
    await this.waitForTronWeb();

    try {
      const contract = await this.tronWeb.contract().at(contractAddress);
      const balance = await contract.balanceOf(account).call();

      // Convert from smallest unit to token unit (assuming 6 decimals)
      return balance.toString();
    } catch (error) {
      console.error("Error getting token balance:", error);
      return "0";
    }
  }

  async balanceOf(token: any, account: string) {
    return await this.getBalance(token, account);
  }

  /**
    * Estimate gas limit for transfer transaction
    * @param data Transfer data
    * @returns Gas limit estimate (bandwidth or energy), gas price, and estimated gas cost
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
    const { originAsset } = data;

    await this.waitForTronWeb();

    // Tron uses bandwidth for TRX transfers and energy for smart contract calls
    // TRX transfer: ~268 bandwidth
    // TRC20 transfer: ~30000 energy (estimated)
    let gasLimit: bigint;

    if (originAsset === "TRX" || originAsset === "trx") {
      // TRX transfer uses bandwidth (typically 268)
      gasLimit = 268n;
    } else {
      // TRC20 token transfer uses energy (typically 30000-35000)
      gasLimit = 30000n;
    }

    // Increase by 20% to provide buffer
    gasLimit = (gasLimit * 120n) / 100n;

    // Get current energy price from Tron (in sun)
    // For bandwidth, it's free if you have bandwidth
    // For energy, the price varies, typically 420 sun per energy unit
    let gasPrice: bigint = 100n;
    // try {
    //   const chainParameters = await this.tronWeb.trx.getChainParameters();
    //   const energyPrice = chainParameters?.find((p: any) => p.key === "getEnergyFee")?.value || 420;
    //   gasPrice = BigInt(energyPrice);
    // } catch (error) {
    //   // Default energy price: 420 sun per energy unit
    //   gasPrice = 420n;
    // }

    // Calculate estimated gas cost: gasLimit * gasPrice
    const estimateGas = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimateGas
    };
  }

  async checkTransactionStatus(txHash: string) {
    await this.waitForTronWeb();

    try {
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txHash);

      if (txInfo && txInfo.receipt) {
        return txInfo.receipt.result === "SUCCESS";
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async getTransactionResult(txHash: string) {
    await this.waitForTronWeb();

    try {
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txHash);
      return txInfo;
    } catch (error) {
      return {};
    }
  }

  async allowance(params: any) {
    const {
      contractAddress,
      spender,
      address,
      amountWei,
    } = params;

    await this.waitForTronWeb();

    try {
      // Get contract instance
      const contract = await this.tronWeb.contract().at(contractAddress);

      // Get allowance
      let allowance = "0";
      try {
        const allowanceResult = await contract.allowance(address, spender).call();
        allowance = allowanceResult.toString();
      } catch (error) {
        console.log("Error getting allowance: %o", error);
      }

      return {
        contract,
        allowance,
        needApprove: Big(amountWei || 0).gt(allowance || 0),
      };
    } catch (error) {
      console.log("Error in allowance: %o", error);
      // Return default values on error
      return {
        contract: null,
        allowance: "0",
        needApprove: true,
      };
    }
  }

  async approve(params: any) {
    const {
      contractAddress,
      spender,
      amountWei,
      isApproveMax = false,
    } = params;

    await this.waitForTronWeb();

    try {
      // Determine approval amount
      let _amountWei = amountWei;
      if (isApproveMax) {
        // Max uint256 value: 2^256 - 1
        _amountWei = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      }

      // Build approve transaction using triggerSmartContract
      const functionSelector = 'approve(address,uint256)';
      const parameter = [
        { type: 'address', value: spender },
        { type: 'uint256', value: _amountWei }
      ];
      const tx = await this.tronWeb.transactionBuilder.triggerSmartContract(
        contractAddress,
        functionSelector,
        {},
        parameter
      );

      // Sign and send transaction
      const result = await this.signAndSendTransaction(tx.transaction);

      if (typeof result === "string") {
        return result;
      }

      return result.txid;
    } catch (error) {
      console.log("Error approve: %o", error);
      return false;
    }
  }

  async getEnergyPrice() {
    await this.waitForTronWeb();
    let energyFee: any = 100; // Default 280 Sun/Energy
    // try {
    //   const params = await this.tronWeb.trx.getChainParameters();
    //   energyFee = params.find((p: any) => p.key === "getEnergyFee")?.value || 280;
    //   console.log('Energy Fee:', energyFee, 'Sun/Energy');
    // } catch (err) {
    //   console.error("Error getting energy price:", err);
    // }
    return energyFee;
  }

  toBytes32(addr: string): string {
    const hex = this.tronWeb.address.toHex(addr).slice(2);
    return "0x" + hex.padStart(64, "0");
  }

  async quoteOFT(params: any) {
    const {
      abi,
      dstEid,
      recipient,
      amountWei,
      slippageTolerance,
      payInLzToken,
      fromToken,
      toToken,
      prices,
      originLayerzeroAddress,
      destinationLayerzeroAddress,
      excludeFees,
      refundTo,
      multiHopComposer,
      isMultiHopComposer,
      isOriginLegacy,
      isDestinationLegacy,
      originLayerzero,
    } = params;

    const result: any = {
      needApprove: false,
      approveSpender: originLayerzeroAddress,
      sendParam: void 0,
      quoteParam: {
        ...params,
        originLayerzeroAddress: originLayerzeroAddress,
        destinationLayerzeroAddress: destinationLayerzeroAddress,
      },
      fees: {},
      totalFeesUsd: void 0,
      estimateSourceGas: void 0,
      estimateSourceGasUsd: void 0,
      estimateTime: 0, // seconds - dynamically calculated using LayerZero formula
      outputAmount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** params.fromToken.decimals).toFixed(params.fromToken.decimals, 0)),
    };

    await this.waitForTronWeb();

    const oftContract = await this.tronWeb.contract(abi, originLayerzeroAddress);

    // 1. check if need approve
    const approvalRequired = await oftContract.approvalRequired().call();
    // check approve status
    // console.log("%cApprovalRequired: %o", "background:blue;color:white;", result.needApprove);

    // If approval is required, check actual allowance
    if (approvalRequired) {
      try {
        // Get user address (use refundTo if provided, otherwise use default address)
        const userAddress = refundTo || this.tronWeb.defaultAddress.base58;

        // Check allowance
        const allowanceResult = await this.allowance({
          contractAddress: fromToken.contractAddress,
          spender: originLayerzeroAddress,
          address: userAddress,
          amountWei,
        });
        result.needApprove = allowanceResult.needApprove;
      } catch (error) {
        console.log("Error checking allowance: %o", error);
      }
    }

    const lzReceiveOptionGas = isOriginLegacy ? originLayerzero.lzReceiveOptionGasLegacy : originLayerzero.lzReceiveOptionGas;
    let lzReceiveOptionValue = 0;

    const destATA = await getDestinationAssociatedTokenAddress({
      recipient,
      toToken,
    });
    if (destATA.needCreateTokenAccount) {
      lzReceiveOptionValue = LZ_RECEIVE_VALUE[toToken.chainName] || 0;
    }

    // 2. quote send
    const sendParam: any = [
      // dstEid
      dstEid,
      // to
      // "0x0000000000000000000000000000000000000000000000000000000000000000",
      addressToBytes32(toToken.chainType, recipient),
      // amountLD
      amountWei,
      // minAmountLD
      "0",
      // extraOptions
      Options.newOptions()
        .addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue)
        .toHex(),
      // composeMsg
      "0x",
      // oftCmd
      "0x",
    ];

    if (isMultiHopComposer) {
      // multiHopComposer: Arbitrum legacy mesh MultiHopComposer, eid = 30110
      sendParam[0] = multiHopComposer.eid; // dstEid
      sendParam[1] = addressToBytes32("evm", multiHopComposer.oftMultiHopComposer); // to
    }

    const oftData = await oftContract.quoteOFT(sendParam).call();
    const [, , oftReceipt] = oftData;
    sendParam[3] = Big(oftReceipt[1].toString()).times(Big(1).minus(Big(slippageTolerance || 0).div(100))).toFixed(0);

    const msgFee = await oftContract.quoteSend(sendParam, payInLzToken).call();
    let nativeMsgFee: BigInt = msgFee[0]["nativeFee"];
    if (nativeMsgFee) {
      nativeMsgFee = BigInt(Big(nativeMsgFee.toString()).times(1.2).toFixed(0));
    }
    result.estimateSourceGas = nativeMsgFee;

    if (isMultiHopComposer) {
      const composeMsgSendParam = {
        dstEid,
        to: addressToBytes32(toToken.chainType, recipient),
        amountLD: sendParam[2],
        minAmountLD: sendParam[3],
        extraOptions: Options.newOptions()
          .addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue)
          .toHex(),
        composeMsg: "0x",
        oftCmd: "0x",
      };
      const hopMsgFee = await getHopMsgFee({
        sendParam: composeMsgSendParam,
        toToken,
      });

      sendParam[4] = Options.newOptions()
        .addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue)
        .addExecutorComposeOption(0, originLayerzero.composeOptionGas || 800000, hopMsgFee)
        .toHex();
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      sendParam[5] = abiCoder.encode(
        ["tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd)"],
        [Object.values(composeMsgSendParam)]
      );
    }

    // console.log("%cMsgFee: %o", "background:blue;color:white;", msgFee);

    result.sendParam = {
      param: [
        // sendParam
        sendParam,
        // feeParam
        [
          // nativeFee
          nativeMsgFee.toString(),
          // lzTokenFee
          msgFee[0]["lzTokenFee"].toString(),
        ],
        // refundAddress
        refundTo,
      ],
      options: { callValue: nativeMsgFee.toString() },
    };

    // console.log("%cParams: %o", "background:blue;color:white;", result.sendParam);

    // 3. estimate gas
    const nativeFeeUsd = Big(nativeMsgFee?.toString() || 0).div(10 ** fromToken.nativeToken.decimals).times(getPrice(prices, fromToken.nativeToken.symbol));
    result.fees.nativeFee = numberRemoveEndZero(Big(nativeMsgFee?.toString() || 0).div(10 ** fromToken.nativeToken.decimals).toFixed(fromToken.nativeToken.decimals));
    result.fees.nativeFeeUsd = numberRemoveEndZero(Big(nativeFeeUsd).toFixed(20));
    result.fees.lzTokenFeeUsd = numberRemoveEndZero(Big(msgFee[0]["lzTokenFee"]?.toString() || 0).div(10 ** fromToken.decimals).toFixed(20));

    // 0.03% fee for Legacy Mesh transfers only (native USDT0 transfers are free)
    if (isOriginLegacy || isDestinationLegacy) {
      result.fees.legacyMeshFeeUsd = numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).times(USDT0_LEGACY_MESH_TRANSFTER_FEE).toFixed(fromToken.decimals));
      result.outputAmount = numberRemoveEndZero(Big(Big(amountWei || 0).div(10 ** params.fromToken.decimals)).minus(result.fees.legacyMeshFeeUsd || 0).toFixed(params.fromToken.decimals, 0));
    }

    const transactionParams = [
      originLayerzeroAddress,
      "send((uint32,bytes32,uint256,uint256,bytes,bytes,bytes),(uint256,uint256),address)",
      result.sendParam.options,
      [
        {
          type: "tuple(uint32,bytes32,uint256,uint256,bytes,bytes,bytes)",
          value: result.sendParam.param[0]
        },
        {
          type: "tuple(uint256,uint256)",
          value: result.sendParam.param[1]
        },
        {
          type: "address",
          value: result.sendParam.param[2]
        }
      ],
      this.tronWeb.defaultAddress.base58 || refundTo
    ];
    const energyPrice = await this.getEnergyPrice();

    const tx = await this.tronWeb.transactionBuilder.triggerSmartContract(...transactionParams);
    result.sendParam.tx = tx;

    try {
      const transaction = await this.tronWeb.transactionBuilder.triggerConstantContract(...transactionParams);
      const energyUsed = transaction.energy_used || 200000;
      const rawDataHexLength = transaction.transaction.raw_data_hex.length || 1000;
      const bandwidthAmount = (rawDataHexLength / 2 + DATA_HEX_PROTOBUF_EXTRA + SIGNATURE_SIZE) * 0.001;

      const amount = Big(energyUsed || 0).times(energyPrice).div(10 ** fromToken.nativeToken.decimals);
      const totalAmount = Big(amount).plus(bandwidthAmount);
      const usd = numberRemoveEndZero(Big(totalAmount).times(getPrice(prices, fromToken.nativeToken.symbol)).toFixed(20));
      result.fees.estimateGasUsd = usd;
      result.estimateSourceGas = numberRemoveEndZero(Big(totalAmount).times(10 ** fromToken.nativeToken.decimals).toFixed(fromToken.nativeToken.decimals));
      result.estimateSourceGasUsd = usd;
    } catch (error) {
      const energyUsed = 200000;
      const rawDataHexLength = 1000;
      const bandwidthAmount = (rawDataHexLength / 2 + DATA_HEX_PROTOBUF_EXTRA + SIGNATURE_SIZE) * 0.001;

      const amount = Big(energyUsed || 0).times(energyPrice).div(10 ** fromToken.nativeToken.decimals);
      const totalAmount = Big(amount).plus(bandwidthAmount);
      const usd = numberRemoveEndZero(Big(totalAmount).times(getPrice(prices, fromToken.nativeToken.symbol)).toFixed(20));
      result.fees.estimateGasUsd = usd;
      result.estimateSourceGas = numberRemoveEndZero(Big(totalAmount).times(10 ** fromToken.nativeToken.decimals).toFixed(fromToken.nativeToken.decimals));
      result.estimateSourceGasUsd = usd;
    }

    // calculate total fees
    for (const feeKey in result.fees) {
      if (excludeFees.includes(feeKey)) {
        continue;
      }
      result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
    }
    result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd).toFixed(20));

    result.sendParam.transactionParams = transactionParams;

    return result;
  }

  async sendTransaction(params: any) {
    const {
      tx,
    } = params;

    const result = await this.signAndSendTransaction(tx.transaction);

    if (typeof result === "object" && result.message) {
      if (/user rejected the transaction/i.test(result.message)) {
        throw new Error("User rejected the transaction");
      }
    }

    if (typeof result === "string") {
      return result;
    }

    return result.txid;
  }

  /**
   * Unified quote method that routes to specific quote methods based on type
   * @param type Service type from ServiceType
   * @param params Parameters for the quote
   */
  async quote(type: ServiceType, params: any) {
    switch (type) {
      case Service.Usdt0:
        return await this.quoteOFT(params);
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

  async quoteOneClickProxy(params: any) {
    const {
      proxyAddress,
      abi,
      fromToken,
      refundTo,
      depositAddress,
      amountWei,
      prices,
    } = params;

    const result: any = { fees: {} };

    await this.waitForTronWeb();
    const userAddress = refundTo || this.tronWeb.defaultAddress.base58;

    try {
      const allowance = await this.allowance({
        contractAddress: fromToken.contractAddress,
        address: userAddress,
        spender: proxyAddress,
        amountWei: amountWei,
      });
      result.needApprove = allowance.needApprove;
      result.approveSpender = proxyAddress;
    } catch (error) {
      console.log("oneclick check allowance failed: %o", error);
    }

    const proxyParam: any = [
      // tokenAddress
      fromToken.contractAddress,
      // recipient
      depositAddress,
      // amount
      amountWei,
    ];
    result.sendParam = {
      param: proxyParam,
    };

    const transactionParams = [
      proxyAddress,
      "proxyTransfer(address,address,uint256)",
      {},
      [
        {
          type: "address",
          value: result.sendParam.param[0] // tokenAddress
        },
        {
          type: "address",
          value: result.sendParam.param[1] // recipient
        },
        {
          type: "uint256",
          value: result.sendParam.param[2] // amount
        }
      ],
      this.tronWeb.defaultAddress.base58 || refundTo
    ];
    // Get current energy price from Tron
    const energyPrice = await this.getEnergyPrice();

    const tx = await this.tronWeb.transactionBuilder.triggerSmartContract(...transactionParams);
    result.sendParam.tx = tx;

    try {
      const transaction = await this.tronWeb.transactionBuilder.triggerConstantContract(...transactionParams);
      const energyUsed = transaction.energy_used || 30000;
      const rawDataHexLength = transaction.transaction.raw_data_hex.length || 500;
      const bandwidthAmount = (rawDataHexLength / 2 + DATA_HEX_PROTOBUF_EXTRA + SIGNATURE_SIZE) * 0.001;

      const amount = Big(energyUsed || 0).times(energyPrice).div(10 ** fromToken.nativeToken.decimals);
      const totalAmount = Big(amount).plus(bandwidthAmount);
      const usd = numberRemoveEndZero(Big(totalAmount).times(getPrice(prices, fromToken.nativeToken.symbol)).toFixed(20));
      result.fees.sourceGasFeeUsd = usd;
      result.estimateSourceGas = numberRemoveEndZero(Big(totalAmount).times(10 ** fromToken.nativeToken.decimals).toFixed(fromToken.nativeToken.decimals));
      result.estimateSourceGasUsd = usd;
    } catch (error) {
      const energyUsed = 169000;
      const rawDataHexLength = 500;
      const bandwidthAmount = (rawDataHexLength / 2 + DATA_HEX_PROTOBUF_EXTRA + SIGNATURE_SIZE) * 0.001;

      const amount = Big(energyUsed || 0).times(energyPrice).div(10 ** fromToken.nativeToken.decimals);
      const totalAmount = Big(amount).plus(bandwidthAmount);
      const usd = numberRemoveEndZero(Big(totalAmount).times(getPrice(prices, fromToken.nativeToken.symbol)).toFixed(20));
      result.fees.estimateGasUsd = usd;
      result.estimateSourceGas = numberRemoveEndZero(Big(totalAmount).times(10 ** fromToken.nativeToken.decimals).toFixed(fromToken.nativeToken.decimals));
      result.estimateSourceGasUsd = usd;
    }

    result.sendParam.transactionParams = transactionParams;

    return result;
  }

  async getAccountResources(params: any) {
    const { account } = params;

    const result: any = {
      energy: 0,
      bandwidth: 0,
      success: false,
      error: "TronWeb is not initialized or the wallet is not connected",
    };

    await this.waitForTronWeb();

    if (!this.tronWeb || !account) {
      return result;
    }

    try {
      let availableEnergy;
      let availableBandwidth;

      try {
        if (this.tronWeb.trx.getAccountResources) {
          const resources: any = await this.tronWeb.trx.getAccountResources(account);
          console.log("resources: %o", resources);
          if (resources) {
            // Get available energy (EnergyLimit - EnergyUsed)
            availableEnergy = (resources.EnergyLimit || 0) - (resources.EnergyUsed || 0);
            // Get available bandwidth (NetLimit - NetUsed)
            availableBandwidth = (resources.freeNetLimit || 0) - (resources.freeNetUsed || 0);
          }
        }
      } catch (resourcesErr) {
        console.warn("getAccountResources API is not available, try other way:", resourcesErr);
      }

      if (availableEnergy === void 0 && availableBandwidth === void 0) {
        const accountInfo: any = await this.tronWeb.trx.getAccount(account);

        if (accountInfo.account_resource) {
          const accountResource = accountInfo.account_resource;
          availableEnergy = (accountResource.EnergyLimit || 0) - (accountResource.EnergyUsed || 0);
          availableBandwidth = (accountResource.NetLimit || 0) - (accountResource.NetUsed || 0);
        } else if (accountInfo.energy !== undefined) {
          availableEnergy = accountInfo.energy || 0;
        }

        // Try to get bandwidth information
        if (accountInfo.bandwidth !== undefined) {
          if (typeof accountInfo.bandwidth === "number") {
            availableBandwidth = accountInfo.bandwidth;
          } else if (accountInfo.bandwidth) {
            availableBandwidth = accountInfo.bandwidth.available || accountInfo.bandwidth.freeNetUsage || 0;
          }
        }
      }

      result.energy = Math.max(0, availableEnergy);
      result.bandwidth = Math.max(0, availableBandwidth);
      result.success = true;
      result.error = null;
    } catch (error) {
      console.error("Failed to get account resources:", error);
    }

    return result;
  }
}

export { TronWallet };
