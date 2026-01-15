import erc20Abi from "./config/erc20";
import { getPrice } from "../utils/price";
import { numberRemoveEndZero } from "../utils/number";
import Big from "big.js";
import { ethers } from "ethers";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { addressToBytes32 } from "../utils/address";
import { LZ_RECEIVE_VALUE, USDT0_LEGACY_MESH_TRANSFTER_FEE } from "../bridges/usdt0/config";
import cctpService from "../bridges/cctp";
import { SendType } from "../core/Send";
import { Service, type ServiceType } from "../core/Service";
import { getHopMsgFee } from "../bridges/usdt0/hop-composer";
import { getDestinationAssociatedTokenAddress } from "./utils/solana";

const DEFAULT_GAS_LIMIT = 100000n;

export default class EVMWallet {
  provider: any;
  signer: any;

  constructor(_provider: any, _signer?: any) {
    this.provider = _provider;
    this.signer = _signer;
  }

  async transfer(data: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }) {
    const { originAsset, depositAddress, amount } = data;

    if (originAsset === "eth") {
      const tx = await this.signer.sendTransaction({
        to: depositAddress,
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      return tx;
    }

    const contract = new ethers.Contract(originAsset, erc20Abi, this.signer);

    const tx = await contract.transfer(depositAddress, amount);
    const result = await tx.wait();

    return result.hash;
  }

  async getBalance(token: any, account: string) {
    try {
      // Use token's rpcUrls if available, otherwise fall back to current provider
      let provider = this.provider;
      if (token.rpcUrls) {
        const providers = token.rpcUrls.map((url: string) => new ethers.JsonRpcProvider(url));
        provider = new ethers.FallbackProvider(providers);
      }

      if (token.symbol === "eth" || token.symbol === "ETH" || token.symbol === "native") {
        const balance = await provider.getBalance(account);
        return balance.toString();
      }

      // Use provider instead of signer for read-only operations
      const contract = new ethers.Contract(token.contractAddress, erc20Abi, provider);

      const balance = await contract.balanceOf(account);
      // console.log("Success getting %s token balance: %o", token.contractAddress, balance);

      return balance.toString();
    } catch (err) {
      console.log("Error getting token balance: %o", err);
      return "0";
    }
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
    const { originAsset, depositAddress, amount } = data;

    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const fromAddress = await this.signer.getAddress();

    let gasLimit: bigint;

    if (originAsset === "eth") {
      // Estimate gas for ETH transfer
      const tx = {
        from: fromAddress,
        to: depositAddress,
        value: ethers.parseEther(amount)
      };
      gasLimit = await this.provider.estimateGas(tx);
    } else {
      // Estimate gas for ERC20 token transfer
      const contract = new ethers.Contract(originAsset, erc20Abi, this.signer);
      gasLimit = await contract.transfer.estimateGas(depositAddress, amount);
    }

    // Increase gas limit by 20% to provide buffer
    gasLimit = (gasLimit * 120n) / 100n;

    // Get gas price
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;

    // Calculate estimated gas cost: gasLimit * gasPrice
    const estimateGas = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimateGas
    };
  }

  getContract(params: any) {
    const {
      contractAddress,
      abi,
    } = params;

    return new ethers.Contract(contractAddress, abi, this.signer);
  }

  async allowance(params: any) {
    const {
      contractAddress,
      spender,
      address,
      amountWei,
    } = params;

    const contract = new ethers.Contract(contractAddress, erc20Abi, this.signer);

    // get allowance
    let allowance = "0";
    try {
      allowance = await contract.allowance(address, spender);
      allowance = allowance.toString();
    } catch (error) {
      console.log("Error getting allowance: %o", error)
    }

    return {
      contract,
      allowance,
      needApprove: Big(amountWei || 0).gt(allowance || 0),
    };
  }

  async approve(params: any) {
    const {
      contractAddress,
      spender,
      amountWei,
      isApproveMax = false,
    } = params;

    const contract = new ethers.Contract(contractAddress, erc20Abi, this.signer);

    let _amountWei = amountWei;
    if (isApproveMax) {
      _amountWei = ethers.MaxUint256;
    }

    try {
      const tx = await contract.approve(spender, _amountWei);
      const txReceipt = await tx.wait();
      if (txReceipt.status === 1) {
        return true;
      }
      return false;
    } catch (error) {
      console.log("Error approve: %o", error)
    }

    return false;
  }

  async getEstimateGas(params: any) {
    const { gasLimit, price, nativeToken } = params;

    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || BigInt("20000000000"); // Default 20 gwei

    const estimateGas = BigInt(gasLimit) * BigInt(gasPrice);
    const estimateGasAmount = Big(estimateGas.toString()).div(10 ** nativeToken.decimals);
    const estimateGasUsd = Big(estimateGasAmount).times(price || 1);

    return {
      gasPrice,
      usd: numberRemoveEndZero(Big(estimateGasUsd).toFixed(20)),
      wei: estimateGas,
      amount: numberRemoveEndZero(Big(estimateGasAmount).toFixed(nativeToken.decimals)),
    };
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

    const oftContract = new ethers.Contract(originLayerzeroAddress, abi, this.signer);
    const oftContractRead = new ethers.Contract(originLayerzeroAddress, abi, this.provider);

    // 1. check if need approve
    const approvalRequired = await oftContractRead.approvalRequired();
    // console.log("%cApprovalRequired: %o", "background:blue;color:white;", approvalRequired);

    // If approval is required, check actual allowance
    if (approvalRequired) {
      try {
        // Check allowance
        const allowanceResult = await this.allowance({
          contractAddress: fromToken.contractAddress,
          spender: originLayerzeroAddress,
          address: refundTo,
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
    const sendParam: any = {
      dstEid: dstEid,
      to: addressToBytes32(toToken.chainType, recipient),
      amountLD: amountWei,
      minAmountLD: 0n,
      extraOptions: Options.newOptions()
        .addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue)
        .toHex(),
      composeMsg: "0x",
      oftCmd: "0x"
    };

    if (isMultiHopComposer) {
      // multiHopComposer: Arbitrum legacy mesh MultiHopComposer, eid = 30110
      sendParam.dstEid = multiHopComposer.eid;
      sendParam.to = addressToBytes32("evm", multiHopComposer.oftMultiHopComposer);

      const composeMsgSendParam = {
        dstEid,
        to: addressToBytes32(toToken.chainType, recipient),
        amountLD: sendParam.amountLD,
        minAmountLD: sendParam.minAmountLD,
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

      sendParam.extraOptions = Options.newOptions()
        .addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue)
        .addExecutorComposeOption(0, originLayerzero.composeOptionGas || 800000, hopMsgFee)
        .toHex();
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      sendParam.composeMsg = abiCoder.encode(
        ["tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd)"],
        [Object.values(composeMsgSendParam)]
      );
    }

    const oftData = await oftContractRead.quoteOFT.staticCall(sendParam);
    const [, , oftReceipt] = oftData;
    sendParam.minAmountLD = oftReceipt[1] * (1000000n - BigInt(slippageTolerance * 10000)) / 1000000n;

    const msgFee = await oftContractRead.quoteSend.staticCall(sendParam, payInLzToken);
    result.estimateSourceGas = msgFee[0];
    // console.log("%cMsgFee: %o", "background:blue;color:white;", msgFee);

    result.sendParam = {
      contract: oftContract,
      method: "send",
      param: [
        sendParam,
        {
          nativeFee: msgFee[0],
          lzTokenFee: msgFee[1],
        },
        refundTo,
        { value: msgFee[0] }
      ],
    };

    // console.log("%cParams: %o", "background:blue;color:white;", result.sendParam);

    // 3. estimate gas
    const nativeFeeUsd = Big(msgFee[0]?.toString() || 0).div(10 ** fromToken.nativeToken.decimals).times(getPrice(prices, fromToken.nativeToken.symbol));
    result.fees.nativeFee = numberRemoveEndZero(Big(msgFee[0]?.toString() || 0).div(10 ** fromToken.nativeToken.decimals).toFixed(fromToken.nativeToken.decimals));
    result.fees.nativeFeeUsd = numberRemoveEndZero(Big(nativeFeeUsd).toFixed(20));
    result.fees.lzTokenFeeUsd = numberRemoveEndZero(Big(msgFee[1]?.toString() || 0).div(10 ** fromToken.decimals).toFixed(20));

    // 0.03% fee for Legacy Mesh transfers only (native USDT0 transfers are free)
    if (isOriginLegacy || isDestinationLegacy) {
      result.fees.legacyMeshFeeUsd = numberRemoveEndZero(Big(amountWei || 0).div(10 ** params.fromToken.decimals).times(USDT0_LEGACY_MESH_TRANSFTER_FEE).toFixed(params.fromToken.decimals));
      result.outputAmount = numberRemoveEndZero(Big(Big(amountWei || 0).div(10 ** params.fromToken.decimals)).minus(result.fees.legacyMeshFeeUsd || 0).toFixed(params.fromToken.decimals, 0));
    }

    try {
      const gasLimit = await oftContract.send.estimateGas(...result.sendParam.param);
      const { usd, wei } = await this.getEstimateGas({
        gasLimit,
        price: getPrice(prices, fromToken.nativeToken.symbol),
        nativeToken: fromToken.nativeToken,
      });
      result.fees.estimateGasUsd = usd;
      result.estimateSourceGas += wei;
      result.estimateSourceGasUsd = usd;
    } catch (error) {
      const { usd, wei } = await this.getEstimateGas({
        gasLimit: DEFAULT_GAS_LIMIT,
        price: getPrice(prices, fromToken.nativeToken.symbol),
        nativeToken: fromToken.nativeToken,
      });
      result.fees.estimateGasUsd = usd;
      result.estimateSourceGas += wei;
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

    return result;
  }

  async sendTransaction(params: any) {
    const {
      method,
      contract,
      param,
    } = params;

    const tx = await contract[method](...param);

    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return txReceipt.hash;
  }

  /**
   * Unified quote method that routes to specific quote methods based on type
   * @param type Service type from ServiceType
   * @param params Parameters for the quote
   */
  async quote(type: ServiceType, params: any) {
    switch (type) {
      case Service.CCTP:
        return await this.quoteCCTP(params);
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

  async quoteCCTP(params: any) {
    const {
      proxyAddress,
      abi,
      refundTo,
      recipient,
      amountWei,
      // slippageTolerance,
      fromToken,
      toToken,
      prices,
      excludeFees,
      destinationDomain,
      sourceDomain,
    } = params;

    const result: any = {
      needApprove: false,
      approveSpender: proxyAddress,
      sendParam: void 0,
      quoteParam: {
        sourceDomain,
        destinationDomain,
        proxyAddress,
        ...params,
      },
      fees: {},
      totalFeesUsd: void 0,
      estimateSourceGas: void 0,
      estimateSourceGasUsd: void 0,
      estimateTime: Math.floor(Math.random() * 8) + 3,
      outputAmount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
    };

    const proxyContract = new ethers.Contract(proxyAddress, abi, this.signer);
    const proxyContractRead = new ethers.Contract(proxyAddress, abi, this.provider);

    let realRecipient = recipient;
    // get ATA address
    const destATA = await getDestinationAssociatedTokenAddress({
      recipient,
      toToken,
    });
    result.needCreateTokenAccount = destATA.needCreateTokenAccount;
    if (destATA.associatedTokenAddress) {
      realRecipient = destATA.associatedTokenAddress;
    }

    // 1. get user nonce
    let userNonce = 0n;
    try {
      userNonce = await proxyContract.userNonces(refundTo);
    } catch (error) {
    }

    // 2. quote signature
    const signatureRes: any = await cctpService.quoteSignature({
      address: refundTo,
      amount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
      destination_domain_id: destinationDomain,
      receipt_address: realRecipient,
      source_domain_id: sourceDomain,
      user_nonce: Number(userNonce),
    });
    const {
      bridge_fee,
      finality_threshold,
      max_fee,
      mint_fee,
      receipt_amount,
      signature,
      destination_caller,
    } = signatureRes;

    result.fees.estimateMintGasUsd = numberRemoveEndZero(Big(mint_fee || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals));
    result.fees.bridgeFeeUsd = numberRemoveEndZero(Big(bridge_fee || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals));
    const chargedAmount = BigInt(amountWei) - BigInt(mint_fee);
    result.outputAmount = numberRemoveEndZero(Big(receipt_amount || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0));

    const depositParam = [
      // originalAmount
      amountWei,
      // chargedAmount = originalAmount - gas fee
      chargedAmount,
      // destinationDomain
      destinationDomain,
      // mintRecipient
      addressToBytes32(toToken.chainType, realRecipient),
      // burnToken
      fromToken.contractAddress,
      // destinationCaller
      destination_caller ? addressToBytes32(toToken.chainType, destination_caller) : "0x0000000000000000000000000000000000000000000000000000000000000000",
      // maxFee
      max_fee,
      // minFinalityThreshold
      finality_threshold,
      // signature
      signature,
    ];

    // 3. estimate deposit gas
    let depositWithFeeGasLimit = 4000000n;
    try {
      const gasLimit = await proxyContract.depositWithFee.estimateGas(...depositParam);
      depositWithFeeGasLimit = gasLimit;
      const { usd, wei } = await this.getEstimateGas({
        gasLimit,
        price: getPrice(prices, fromToken.nativeToken.symbol),
        nativeToken: fromToken.nativeToken,
      });
      result.fees.estimateDepositGasUsd = usd;
      result.estimateSourceGas = wei;
      result.estimateSourceGasUsd = usd;
    } catch (error) {
      const { usd, wei } = await this.getEstimateGas({
        gasLimit: DEFAULT_GAS_LIMIT,
        price: getPrice(prices, fromToken.nativeToken.symbol),
        nativeToken: fromToken.nativeToken,
      });
      result.fees.estimateDepositGasUsd = usd;
      result.estimateSourceGas = wei;
      result.estimateSourceGasUsd = usd;
    }

    result.sendParam = {
      method: "depositWithFee",
      contract: proxyContract,
      param: [
        ...depositParam,
        { gasLimit: depositWithFeeGasLimit }
      ],
    };

    // 4. check approve
    const allowance = await this.allowance({
      contractAddress: fromToken.contractAddress,
      address: refundTo,
      spender: proxyAddress,
      amountWei,
    });
    result.needApprove = allowance.needApprove;
    // get approve gas cost
    if (result.needApprove) {
      try {
        const gasLimit = await allowance.contract.approve.estimateGas(proxyAddress, amountWei);
        const { usd } = await this.getEstimateGas({
          gasLimit,
          price: getPrice(prices, fromToken.nativeToken.symbol),
          nativeToken: fromToken.nativeToken,
        });
        result.fees.estimateApproveGasUsd = usd;
      } catch (error) {
        console.log("cctp estimate approve gas failed: %o", error);
      }
    }

    // 5. calculate total fees
    for (const feeKey in result.fees) {
      if (excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
        continue;
      }
      result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
    }
    result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd).toFixed(20));

    return result;
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

    try {
      const allowance = await this.allowance({
        contractAddress: fromToken.contractAddress,
        address: refundTo,
        spender: proxyAddress,
        amountWei: amountWei,
      });
      result.needApprove = allowance.needApprove;
      result.approveSpender = proxyAddress;
    } catch (error) {
      console.log("oneclick check allowance failed: %o", error);
    }

    const proxyContract = new ethers.Contract(proxyAddress, abi, this.signer);
    const proxyParam: any = [
      // tokenAddress
      fromToken.contractAddress,
      // recipient
      depositAddress,
      // amount
      amountWei,
    ];

    let proxyTransferGasLimit = 4000000n;
    try {
      const gasLimit = await proxyContract.proxyTransfer.estimateGas(...proxyParam);
      proxyTransferGasLimit = gasLimit;
      const { usd, wei } = await this.getEstimateGas({
        gasLimit,
        price: getPrice(prices, fromToken.nativeToken.symbol),
        nativeToken: fromToken.nativeToken,
      });
      result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(usd).toFixed(20));
      result.estimateSourceGas = wei;
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(usd).toFixed(20));
    } catch (error) {
      const { usd, wei } = await this.getEstimateGas({
        gasLimit: DEFAULT_GAS_LIMIT,
        price: getPrice(prices, fromToken.nativeToken.symbol),
        nativeToken: fromToken.nativeToken,
      });
      result.fees.sourceGasFeeUsd = numberRemoveEndZero(Big(usd).toFixed(20));
      result.estimateSourceGas = wei;
      result.estimateSourceGasUsd = numberRemoveEndZero(Big(usd).toFixed(20));
    }

    result.sendParam = {
      method: "proxyTransfer",
      contract: proxyContract,
      param: [
        ...proxyParam,
        { gasLimit: proxyTransferGasLimit }
      ],
    };

    return result;
  }
}

export { EVMWallet };
