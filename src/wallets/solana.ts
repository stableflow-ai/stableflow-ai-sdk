import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  ComputeBudgetProgram,
  SendTransactionError,
  TransactionMessage,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import Big from "big.js";
import { getPrice } from "../utils/price";
import { numberRemoveEndZero } from "../utils/number";
// @ts-ignore --resolveJsonModule
import stableflowProxyIdl from "../bridges/oneclick/stableflow-proxy.json";
import { SendType } from "../core/Send";
import { Service } from "../core/Service";
import { getChainRpcUrl } from "./config/rpcs";
import { LZ_RECEIVE_VALUE, USDT0_LEGACY_MESH_TRANSFTER_FEE } from "../bridges/usdt0/config";
import { ethers, getBytes } from "ethers";
import { getHopMsgFee } from "../bridges/usdt0/hop-composer";
import { deriveOftPdas, encodeQuoteSend, encodeSend, getPeerAddress, NATIVE_MSG_FEE_BUFFER } from "./utils/layerzero";
import { buildVersionedTransaction, SendHelper } from "@layerzerolabs/lz-solana-sdk-v2";
import { Csl } from "../utils/log";
import { OpenAPI } from "../core/OpenAPI";
import { createSolanaFallbackConnection, getAvailableSolanaRpcUrl } from "./utils/solana";
import { ExecTime } from "../utils/exec-time";
import { addressToBytes32 } from "../utils/address";
import { quoteSignature } from "./utils/cctp";
import { fromWeb3JsPublicKey, toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { findAssociatedTokenPda, mplToolbox, safeFetchToken } from "@metaplex-foundation/mpl-toolbox";
import { publicKey } from "@metaplex-foundation/umi";
import { oft } from "@layerzerolabs/oft-v2-solana-sdk";

export default class SolanaWallet {
  private publicKey: PublicKey | null;
  private signTransaction: any;
  private signer: any;
  private csl;

  constructor(options: { publicKey: PublicKey | null; signer: any }) {
    this.publicKey = options.publicKey;
    this.signTransaction = options.signer.signTransaction;
    this.signer = options.signer;

    const cs = new Csl(OpenAPI.DEBUG);
    this.csl = cs.log;
  }

  getConnection() {
    const solanaRpcUrls: string[] = getChainRpcUrl("solana").rpcUrls;
    return createSolanaFallbackConnection(solanaRpcUrls);
  };

  // Transfer SOL
  async transferSOL(to: string, amount: string) {
    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    const fromPubkey = this.publicKey;
    const toPubkey = new PublicKey(to);
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports
      })
    );

    const connection = this.getConnection();
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signedTransaction = await this.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    await connection.confirmTransaction(signature);
    return signature;
  }

  // Transfer SPL token
  async transferToken(tokenMint: string, to: string, amount: string) {
    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    const connection = this.getConnection();

    const fromPubkey = this.publicKey;
    const toPubkey = new PublicKey(to);
    const mint = new PublicKey(tokenMint);

    // Get associated token account addresses
    const fromTokenAccount = getAssociatedTokenAddressSync(mint, fromPubkey);
    const toTokenAccount = getAssociatedTokenAddressSync(mint, toPubkey);

    const transaction = new Transaction();

    // Check if recipient has token account, create if not
    try {
      await getAccount(connection, toTokenAccount);
    } catch (error) {
      // If token account doesn't exist, create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // payer
          toTokenAccount, // ata
          toPubkey, // owner
          mint // mint
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        BigInt(amount),
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signedTransaction = await this.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    await connection.confirmTransaction(signature);

    return signature;
  }

  // Generic transfer method
  async transfer(data: {
    originAsset: string;
    depositAddress: string;
    amount: string;
  }) {
    const { originAsset, depositAddress, amount } = data;

    // Transfer SOL
    if (originAsset === "SOL" || originAsset === "sol") {
      return await this.transferSOL(depositAddress, amount);
    }

    // Transfer SPL token
    const result = await this.transferToken(
      originAsset,
      depositAddress,
      amount
    );
    return result;
  }

  async getSOLBalance(account: string, options?: { isCatchError?: boolean; }) {
    const { isCatchError = false } = options || {};

    const connection = this.getConnection();

    try {
      const publicKey = new PublicKey(account);
      const balance = await connection.getBalance(publicKey);
      return balance;
    } catch (error) {
      this.csl("Solana getSOLBalance", "red-500", "Get SOL balance failed: %o", error);
      if (isCatchError) {
        throw error;
      }
      return "0";
    }
  }

  async getTokenBalance(tokenMint: string, account: string, options?: { isCatchError?: boolean; }) {
    const { isCatchError = false } = options || {};

    const connection = this.getConnection();

    const mint = new PublicKey(tokenMint);
    const owner = new PublicKey(account);

    try {
      const tokenAccount = await getAssociatedTokenAddress(mint, owner);

      const accountInfo = await getAccount(connection, tokenAccount);

      return accountInfo.amount;
    } catch (error: any) {
      if (error.message.includes("could not find account")) {
        return "0";
      }
      if (isCatchError) {
        throw error;
      }
      return "0";
    }
  }

  async getBalance(token: any, account: string, options?: { isCatchError?: boolean; }) {
    if (
      token.symbol === "SOL" ||
      token.symbol === "sol" ||
      token.symbol === "native"
    ) {
      return await this.getSOLBalance(account, options);
    }
    return await this.getTokenBalance(token.contractAddress, account, options);
  }

  async balanceOf(token: any, account: string, options?: { isCatchError?: boolean; }) {
    return await this.getBalance(token, account, options);
  }

  /**
   * Estimate gas limit for transfer transaction
   * @param data Transfer data
   * @returns Gas limit estimate, gas price, and estimated gas cost
   */
  async estimateTransferGas(data: {
    fromToken: any;
    depositAddress: string;
    amount: string;
  }): Promise<{
    gasLimit: bigint;
    gasPrice: bigint;
    estimateGas: bigint;
  }> {
    const connection = this.getConnection();

    // Solana transaction fees are typically fixed at 5000 lamports per signature
    // Base fee per signature: 5000 lamports
    let estimatedFee = 5000n;

    const { fromToken, depositAddress } = data;
    const originAsset = fromToken.contractAddress;

    // Check if token account creation is needed for SPL tokens
    if (originAsset !== "SOL" && originAsset !== "sol") {
      const mint = new PublicKey(originAsset);
      const toPubkey = new PublicKey(depositAddress);
      const toTokenAccount = getAssociatedTokenAddressSync(mint, toPubkey);

      // Check if recipient has token account
      try {
        await getAccount(connection, toTokenAccount);
        // Account exists, no additional fee
      } catch (error) {
        // Account doesn't exist, will need to create it (additional fee)
        estimatedFee += 5000n;
      }
    }

    return {
      gasLimit: estimatedFee,
      gasPrice: 1n,
      estimateGas: estimatedFee
    };
  }

  async getEstimateGas(params: any) {
    const { gasLimit = "5000", price, nativeToken } = params;

    const estimateGas = BigInt(gasLimit);
    const estimateGasAmount = Big(estimateGas.toString()).div(10 ** nativeToken.decimals);
    const estimateGasUsd = Big(estimateGasAmount).times(price || 1);

    return {
      gasPrice: 1n,
      usd: numberRemoveEndZero(Big(estimateGasUsd).toFixed(20)),
      wei: estimateGas,
      amount: numberRemoveEndZero(Big(estimateGasAmount).toFixed(nativeToken.decimals)),
    };
  }

  async estimateTransaction(params: any) {
    const {
      dry,
      versionedTx,
      fromToken,
      prices,
    } = params;

    const connection = this.getConnection();

    const nativeTokenPrice = getPrice(prices, fromToken.nativeToken.symbol);

    let estimatedFee = 5000n;
    if (!dry) {
      try {
        const sendSim = await connection.simulateTransaction(versionedTx, {
          sigVerify: false,
          replaceRecentBlockhash: true,
        });
        this.csl("Solana estimateTransaction", "purple-400", "sendSim: %o", sendSim);
        // Even if simulation fails (e.g., insufficient funds), we can still get the fee estimate
        if (!sendSim.value.err) {
          // @ts-ignore Solana base fee is 5000 lamports per signature
          estimatedFee = (sendSim.value as any).fee || 5000n;
        } else {
          // If simulation fails, log it but continue with default fee
          console.warn('Send simulation failed (this is normal in quote phase):', sendSim.value.err);
          // @ts-ignore Try to get fee even if simulation failed
          const fee = (sendSim.value as any).fee;
          if (fee) {
            estimatedFee = fee;
          }
        }
      } catch (error) {
        // this.csl("Solana estimateTransaction", "red-500", "estimateTransaction failed: %o", error);
      }
    }

    const result = {
      estimateSourceGasLimit: BigInt(estimatedFee),
      estimateSourceGas: 0n,
      estimateSourceGasUsd: "0",
    };

    const setDefaultGasLimit = async () => {
      const { usd, wei } = await this.getEstimateGas({
        gasLimit: estimatedFee,
        price: nativeTokenPrice,
        nativeToken: fromToken.nativeToken,
      });
      result.estimateSourceGas = wei;
      result.estimateSourceGasUsd = usd;
    };

    await setDefaultGasLimit();
    return result;
  }

  async checkTransactionStatus(signature: string) {
    const connection = this.getConnection();

    const maxAttempts = 30;
    const interval = 4000;
    let timer: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const tx = await connection.getTransaction(signature, {
          commitment: "finalized",
          maxSupportedTransactionVersion: 0
        });

        if (tx) {
          if (tx.meta && tx.meta.err === null) {
            return true;
          } else {
            return false;
          }
        } else {
          this.csl("Solana checkTransactionStatus", "purple-400", "polling attempt %d/%d: transaction not confirmed...", attempt, maxAttempts);
        }
      } catch (error: any) {
        this.csl("Solana checkTransactionStatus", "red-500", "checkTransactionStatus failed: %o", error.message);
      }

      await new Promise((resolve) => {
        timer = setTimeout(() => {
          clearTimeout(timer);
          resolve(true);
        }, interval);
      });
    }

    this.csl("Solana checkTransactionStatus", "red-500", "checkTransactionStatus failed: timeout");
    return false;
  }

  async simulateIx(ix: any) {
    const connection = this.getConnection();

    const tx = new Transaction().add(ix);

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = this.publicKey!;

    // Convert Transaction to VersionedTransaction to use config options
    const message = tx.compileMessage();
    const versionedTx = new VersionedTransaction(message);

    const sim = await connection.simulateTransaction(versionedTx, {
      // commitment: "confirmed",
      sigVerify: false
    });

    if (sim.value.err) console.error("Error:", sim.value.err);

    this.csl("Solana simulateIx", "purple-400", "sim: %o", sim);

    return sim.value;
  }

  async quoteOFT(params: any) {
    const { Options } = await import("@layerzerolabs/lz-v2-utilities");
    const {
      dry,
      originLayerzeroAddress,
      destinationLayerzeroAddress,
      fromToken,
      toToken,
      dstEid,
      refundTo,
      recipient,
      amountWei,
      payInLzToken,
      slippageTolerance,
      multiHopComposer,
      isMultiHopComposer,
      isOriginLegacy,
      isDestinationLegacy,
      prices,
      excludeFees,
      originLayerzero,
      destinationLayerzero,
    } = params;

    const connection = this.getConnection();

    try {
      const result: any = {
        needApprove: false,
        sendParam: void 0,
        fees: {},
        estimateSourceGas: 0n,
        totalEstimateSourceGas: 0n,
        estimateSourceGasUsd: "0",
        outputAmount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
        quoteParam: {
          ...params,
        },
        totalFeesUsd: "0",
        estimateTime: 0,
      };

      const execTime = new ExecTime({ type: "USDT0 Solana", logStyle: "fuchsia-100", isDebug: OpenAPI.DEBUG });

      const programId = new PublicKey(originLayerzeroAddress);
      const tokenMint = new PublicKey(fromToken.contractAddress);
      const quotePayer = new PublicKey("9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn");
      const lookupTable = new PublicKey("6zcTrmdkiQp6dZHYUxVr6A2XVDSYi44X1rcPtvwNcrXi");
      const tokenEscrow = new PublicKey("F1YkdxaiLA1eJt12y3uMAQef48Td3zdJfYhzjphma8hG");
      const sender = this.publicKey!;
      const userPubkey = new PublicKey(refundTo || sender.toString());

      execTime.breakpoint();
      const mintInfo = await connection.getParsedAccountInfo(tokenMint);
      execTime.log("getParsedAccountInfo");
      const decimals = (mintInfo.value?.data as { parsed: { info: { decimals: number } } }).parsed.info
        .decimals;
      const amountLd = BigInt(amountWei);
      const slippage = slippageTolerance || 0.01; // Default 1% slippage
      const minAmountLd = BigInt(Big(amountWei).times(Big(1).minus(Big(slippage).div(100))).toFixed(0));

      const lzReceiveOptionGas = isDestinationLegacy ? destinationLayerzero.lzReceiveOptionGasLegacy : destinationLayerzero.lzReceiveOptionGas;
      const lzReceiveOptionValue = LZ_RECEIVE_VALUE[toToken.chainName] || 0;

      let unMultiHopExtraOptions = Options.newOptions().toBytes() as Uint8Array<any>;
      if (!isMultiHopComposer && lzReceiveOptionValue) {
        unMultiHopExtraOptions = Options.newOptions().addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue).toBytes() as Uint8Array<any>;
      }

      let _dstEid: any = dstEid;
      let to = getBytes(addressToBytes32(toToken.chainType, recipient));

      let extraOptions = unMultiHopExtraOptions;
      let composeMsg = null;
      if (isMultiHopComposer) {
        _dstEid = multiHopComposer.eid;
        to = getBytes(addressToBytes32("evm", multiHopComposer.oftMultiHopComposer));

        let multiHopExtraOptions = Options.newOptions().toHex();
        if (lzReceiveOptionValue) {
          multiHopExtraOptions = Options.newOptions().addExecutorLzReceiveOption(lzReceiveOptionGas, lzReceiveOptionValue).toHex();
        }

        const composeMsgSendParam = {
          dstEid,
          to: addressToBytes32(toToken.chainType, recipient),
          amountLD: amountLd,
          minAmountLD: minAmountLd,
          extraOptions: multiHopExtraOptions,
          composeMsg: "0x",
          oftCmd: "0x",
        };
        execTime.breakpoint();
        const hopMsgFee = await getHopMsgFee({
          sendParam: composeMsgSendParam,
          toToken,
        });
        execTime.log("getHopMsgFee");

        extraOptions = Options.newOptions()
          .addExecutorComposeOption(0, originLayerzero.composeOptionGas || 500000, hopMsgFee)
          .toBytes() as Uint8Array<any>;

        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const composeEncoder = abiCoder.encode(
          ["tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd)"],
          [Object.values(composeMsgSendParam)]);

        composeMsg = ethers.getBytes(composeEncoder);
      }

      execTime.breakpoint();
      const pdas = deriveOftPdas(programId, _dstEid);
      const peerAddress = await getPeerAddress(connection, programId, _dstEid);
      execTime.log("deriveOftPdas+getPeerAddress");

      execTime.breakpoint();
      const tokenSource = await getAssociatedTokenAddress(
        tokenMint,
        userPubkey,
        false,
        TOKEN_PROGRAM_ID,
      );
      execTime.log("getAssociatedTokenAddress");

      const sendHelper = new SendHelper();
      execTime.breakpoint();
      const remainingAccounts = await sendHelper.getQuoteAccounts(
        connection as any,
        quotePayer,
        pdas.oftStore,
        _dstEid,
        peerAddress,
      );
      execTime.log("sendHelper.getQuoteAccounts");

      const ix = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: pdas.oftStore, isSigner: false, isWritable: false },
          { pubkey: pdas.credits, isSigner: false, isWritable: false },
          { pubkey: pdas.peer, isSigner: false, isWritable: false },
          ...remainingAccounts,
        ],
        data: Buffer.from(
          encodeQuoteSend({
            dstEid: _dstEid,
            to,
            amountLd,
            minAmountLd,
            extraOptions,
            composeMsg,
            payInLzToken: false,
          }),
        ),
      });

      execTime.breakpoint();
      const computeIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });
      const tx: any = await buildVersionedTransaction(
        connection as any,
        quotePayer,
        [computeIx, ix],
        undefined,
        undefined,
        lookupTable,
      );
      const sim = await connection.simulateTransaction(tx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });
      execTime.log("buildTx+simulateTransaction(quote)");

      if (sim.value.err) {
        console.error('Simulation logs:', sim, JSON.stringify(sim));
        throw new Error(`Quote failed: ${JSON.stringify(sim.value.err)}`);
      }

      const prefix = `Program return: ${programId} `;
      const log = sim.value.logs?.find((l) => l.startsWith(prefix));
      if (!log) throw new Error('Return data not found');

      const data = Buffer.from(log.slice(prefix.length), 'base64');

      let nativeFee = data.readBigUInt64LE(0);
      this.csl("Solana quoteOFT", "purple-500", "nativeFee: %o", nativeFee);
      nativeFee = nativeFee * NATIVE_MSG_FEE_BUFFER / 100n;
      this.csl("Solana quoteOFT", "purple-500", "nativeFee after buffer: %o", nativeFee);
      const lzTokenFee = data.readBigUInt64LE(8);

      // Convert nativeFee to USD if prices are available
      if (prices && fromToken.nativeToken) {
        const nativeFeeUsd = Big(nativeFee.toString())
          .div(10 ** fromToken.nativeToken.decimals)
          .times(getPrice(prices, fromToken.nativeToken.symbol));
        result.fees.nativeFeeUsd = numberRemoveEndZero(nativeFeeUsd.toFixed(20));
      }
      result.fees.nativeFee = Big(nativeFee.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .toFixed(fromToken.nativeToken.decimals, 0);
      result.totalEstimateSourceGas = nativeFee;

      if (lzTokenFee > 0n && prices && fromToken) {
        const lzTokenFeeUsd = Big(lzTokenFee.toString())
          .div(10 ** fromToken.decimals)
          .times(getPrice(prices, fromToken.symbol));
        result.fees.lzTokenFeeUsd = numberRemoveEndZero(lzTokenFeeUsd.toFixed(20));
      }
      result.fees.lzTokenFee = lzTokenFee.toString();

      let sendTx: any;
      if (!dry) {
        // send
        const sendSendHelper = new SendHelper();
        execTime.breakpoint();
        const sendRemainingAccounts = await sendSendHelper.getSendAccounts(
          connection as any,
          userPubkey,
          pdas.oftStore,
          _dstEid,
          peerAddress,
        );
        execTime.log("getSendAccounts");

        const sendIx = new TransactionInstruction({
          programId,
          keys: [
            { pubkey: userPubkey, isSigner: true, isWritable: true },
            { pubkey: pdas.peer, isSigner: false, isWritable: false },
            { pubkey: pdas.oftStore, isSigner: false, isWritable: true },
            { pubkey: pdas.credits, isSigner: false, isWritable: true },
            { pubkey: tokenSource, isSigner: false, isWritable: true },
            { pubkey: tokenEscrow, isSigner: false, isWritable: true },
            { pubkey: tokenMint, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: pdas.eventAuthority, isSigner: false, isWritable: false },
            { pubkey: programId, isSigner: false, isWritable: false },
            ...sendRemainingAccounts,
          ],
          data: Buffer.from(
            encodeSend({
              dstEid: _dstEid,
              to,
              amountLd,
              minAmountLd,
              extraOptions,
              composeMsg,
              nativeFee,
              lzTokenFee: 0n,
            }),
          ),
        });

        execTime.breakpoint();
        const computeSendIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 });
        sendTx = await buildVersionedTransaction(
          connection as any,
          userPubkey,
          [computeSendIx, sendIx],
          undefined,
          undefined,
          lookupTable,
        );
        execTime.log("buildTx+simulateTransaction(send)");
      }

      const ett = await this.estimateTransaction({
        dry,
        versionedTx: sendTx,
        fromToken,
        prices,
      });

      result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
      result.estimateSourceGasUsd = ett.estimateSourceGasUsd;
      result.estimateSourceGas = ett.estimateSourceGas;
      result.totalEstimateSourceGas += ett.estimateSourceGas;

      // 0.03% fee for Legacy Mesh transfers only (native USDT0 transfers are free)
      result.fees.legacyMeshFeeUsd = numberRemoveEndZero(Big(amountWei || 0).div(10 ** params.fromToken.decimals).times(USDT0_LEGACY_MESH_TRANSFTER_FEE).toFixed(params.fromToken.decimals));
      result.outputAmount = numberRemoveEndZero(Big(Big(amountWei || 0).div(10 ** params.fromToken.decimals)).minus(result.fees.legacyMeshFeeUsd || 0).toFixed(params.fromToken.decimals, 0));

      result.sendParam = {
        transaction: sendTx,
        versionedTx: sendTx,
      };

      // Calculate total fees
      for (const feeKey in result.fees) {
        if (excludeFees && excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
          continue;
        }
        result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
      }
      result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd || 0).toFixed(20));

      execTime.logTotal("quoteOFT");

      return result;
    } catch (error: any) {
      this.csl("Solana quoteOFT", "red-500", "quoteOFT failed: %o", error);
      return { errMsg: error.message };
    }
  }

  async sendTransaction(params: any) {
    const { transaction } = params;

    const connection = this.getConnection();

    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    if (!transaction) {
      throw new Error("Transaction is required");
    }

    const hasAnySignature = (sig: Uint8Array | Buffer | null | undefined) =>
      !!sig && sig.length > 0 && Array.from(sig).some((byte) => byte !== 0);
    let latestBlockhash: Awaited<ReturnType<Connection["getLatestBlockhash"]>> | null = null;
    let didRefreshBlockhash = false;

    // Only refresh blockhash for unsigned transactions.
    // For pre-signed CCTP txs, mutating recentBlockhash invalidates existing signatures.
    if (transaction instanceof Transaction) {
      const isUnsigned = transaction.signatures.every(({ signature }) => !hasAnySignature(signature as any));
      if (isUnsigned) {
        latestBlockhash = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = latestBlockhash.blockhash;
        if (!transaction.feePayer) {
          transaction.feePayer = this.publicKey;
        }
        didRefreshBlockhash = true;
      }
    } else if (transaction instanceof VersionedTransaction) {
      const isUnsigned = transaction.signatures.every((signature) => !hasAnySignature(signature));
      if (isUnsigned) {
        latestBlockhash = await connection.getLatestBlockhash("confirmed");
        // web3.js does not expose a convenient mutator here in typings, but runtime object is mutable.
        (transaction.message as any).recentBlockhash = latestBlockhash.blockhash;
        didRefreshBlockhash = true;
      }
    }

    // Sign the transaction
    const signedTransaction = await this.signTransaction(transaction);

    let signature: string;
    try {
      // Send the transaction
      signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          maxRetries: 3
        }
      );
    } catch (error: any) {
      if (error instanceof SendTransactionError) {
        try {
          const logs = await error.getLogs(connection);
          this.csl("Solana sendTransaction", "red-500", "sendRawTransaction failed logs: %o", logs);
        } catch (logsError: any) {
          this.csl("Solana sendTransaction", "red-500", "failed to fetch SendTransactionError logs: %o", logsError?.message || logsError);
        }
      }
      throw error;
    }

    this.csl("Solana sendTransaction", "green-400", "Transaction sent with signature: %o", signature);

    // // Confirm the transaction
    // // If adding confirmation, you need to catch errors because it may throw a TransactionExpiredBlockheightExceededError.
    // const confirmation = didRefreshBlockhash && latestBlockhash
    //   ? await connection.confirmTransaction(
    //     {
    //       signature,
    //       blockhash: latestBlockhash.blockhash,
    //       lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    //     },
    //     "confirmed"
    //   )
    //   : await connection.confirmTransaction(signature, "confirmed");

    // if (confirmation.value.err) {
    //   throw new Error(
    //     `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
    //   );
    // }

    return signature;
  }

  /**
   * Unified quote method that routes to specific quote methods based on type
   * @param type Service type from Service
   * @param params Parameters for the quote
   */
  async quote(type: Service, params: any) {
    switch (type) {
      case Service.CCTP:
        return this.quoteCCTP(params);
      case Service.Usdt0:
        return this.quoteOFT(params);
      case Service.OneClick:
        return this.quoteOneClickProxy(params);
      case Service.FraxZero:
        return this.quoteFraxZero(params);
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
      dry,
      refundTo,
      proxyAddress,
      fromToken,
      amountWei,
      prices,
      depositAddress,
    } = params;

    const connection = this.getConnection();

    const result: any = { fees: {} };
    try {
      const execTime = new ExecTime({ type: "Oneclick Solana", logStyle: "fuchsia-200", isDebug: OpenAPI.DEBUG });

      const PROGRAM_ID = new PublicKey(proxyAddress);
      const STATE_PDA = new PublicKey("9E8az3Y9sdXvM2f3CCH6c9N3iFyNfDryQCZhqDxRYGUw");
      const MINT = new PublicKey(fromToken.contractAddress);
      const AMOUNT = new BN(amountWei);
      const RECIPIENT = new PublicKey(depositAddress);
      const sender = this.publicKey!;
      const userPubkey = new PublicKey(refundTo || sender.toString());

      // Create AnchorProvider
      const provider = new AnchorProvider(connection, this.signer, {
        commitment: "confirmed"
      });

      // Create Program instance
      const program = new Program<any>(stableflowProxyIdl, PROGRAM_ID, provider);

      // Get user's token account (ATA)
      execTime.breakpoint();
      const userTokenAccount = getAssociatedTokenAddressSync(MINT, userPubkey);
      execTime.log("Get user's token account (ATA)");

      // Get recipient's token account (ATA)
      execTime.breakpoint();
      const toTokenAccount = getAssociatedTokenAddressSync(MINT, RECIPIENT);
      execTime.log("Get recipient's token account (ATA)");

      const transaction = new Transaction();

      execTime.breakpoint();
      try {
        await getAccount(connection, toTokenAccount);
      } catch (error) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            userPubkey,
            toTokenAccount,
            RECIPIENT,
            MINT
          )
        );
      }
      execTime.log("getAccount(toTokenAccount)");

      execTime.breakpoint();
      const transferInstruction = await program.methods
        .transfer(AMOUNT)
        .accounts({
          stableFlowState: STATE_PDA,
          tokenMint: MINT,
          userTokenAccount: userTokenAccount,
          toTokenAccount: toTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          user: userPubkey,
          toUser: RECIPIENT,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      execTime.log("program.methods.transfer.instruction");

      transaction.add(transferInstruction);

      execTime.breakpoint();
      const { blockhash } = await connection.getLatestBlockhash();
      execTime.log("getLatestBlockhash");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;

      execTime.breakpoint();
      const message = transaction.compileMessage();
      const versionedTx = new VersionedTransaction(message);
      const ett = await this.estimateTransaction({
        dry,
        versionedTx,
        fromToken,
        prices,
      });
      execTime.log("estimateTransaction");

      result.sendParam = {
        transaction,
        versionedTx,
      };

      result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
      result.estimateSourceGas = ett.estimateSourceGas;
      result.totalEstimateSourceGas = ett.estimateSourceGas;
      result.estimateSourceGasUsd = ett.estimateSourceGasUsd;

      execTime.logTotal("quoteOneClickPorxy");

      return result;
    } catch (error: any) {
      this.csl("Solana quoteOneClickProxy", "red-500", "error: %o", error);
      return result;
    }
  }

  async quoteCCTP(params: any) {
    const {
      dry,
      proxyAddress,
      refundTo,
      recipient,
      amountWei,
      fromToken,
      prices,
      excludeFees,
      destinationDomain,
      sourceDomain,
    } = params;

    const connection = this.getConnection();

    try {
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
        totalEstimateSourceGas: 0n,
        estimateSourceGasUsd: void 0,
        estimateTime: Math.floor(Math.random() * 8) + 3,
        outputAmount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
      };

      const execTime = new ExecTime({ type: "CCTP Solana", logStyle: "fuchsia-300", isDebug: OpenAPI.DEBUG });

      const PROGRAM_ID = new PublicKey(proxyAddress);
      const MINT = new PublicKey(fromToken.contractAddress);
      const sender = this.publicKey!;
      const userPubkey = new PublicKey(refundTo || sender.toString());

      const [userStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), userPubkey.toBuffer()],
        PROGRAM_ID
      );

      let userNonce = 0;
      execTime.breakpoint();
      try {
        const accountInfo = await connection.getAccountInfo(userStatePda);
        if (accountInfo && accountInfo.data) {
          // UserState structure: user (32 bytes) + nonce (8 bytes) + bump (1 byte)
          // Skip user (32 bytes) and read nonce (8 bytes, little-endian)
          const nonceBuffer = accountInfo.data.slice(32, 40);
          userNonce = Number(new BN(nonceBuffer, "le").toString());
        }
      } catch (error) {
        this.csl("Solana quoteCCTP", "red-500", "UserState not found, using nonce 0");
      }
      execTime.log("getAccountInfo(userStatePda)");

      const userTokenAccount = getAssociatedTokenAddressSync(MINT, userPubkey);

      execTime.breakpoint();
      const signatureRes = await quoteSignature({
        address: userPubkey.toString(),
        amount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
        destination_domain_id: destinationDomain,
        receipt_address: recipient,
        source_domain_id: sourceDomain,
        ata_address: userTokenAccount,
      });
      execTime.log("quoteSignature from our api");

      const {
        bridge_fee,
        mint_fee,
        receipt_amount,
        signature,
      } = signatureRes;

      result.fees.estimateMintGasUsd = numberRemoveEndZero(
        Big(mint_fee || 0)
          .div(10 ** fromToken.decimals)
          .toFixed(fromToken.decimals)
      );
      result.fees.bridgeFeeUsd = numberRemoveEndZero(
        Big(bridge_fee || 0)
          .div(10 ** fromToken.decimals)
          .toFixed(fromToken.decimals)
      );
      result.outputAmount = numberRemoveEndZero(
        Big(receipt_amount || 0)
          .div(10 ** fromToken.decimals)
          .toFixed(fromToken.decimals, 0)
      );

      const operatorTx = Transaction.from(Buffer.from(signature, 'base64'));

      if (!operatorTx.verifySignatures(false)) {
        this.csl("Solana quoteCCTP", "red-500", "Signature verification failed");
      } else {
        this.csl("Solana quoteCCTP", "purple-400", "Signature verification success");
      }

      execTime.breakpoint();
      const message = operatorTx.compileMessage();
      const versionedTx = new VersionedTransaction(message);
      const ett = await this.estimateTransaction({
        dry,
        versionedTx,
        fromToken,
        prices,
      });
      execTime.log("estimateTransaction");

      result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
      result.estimateSourceGas = ett.estimateSourceGas;
      result.totalEstimateSourceGas = ett.estimateSourceGas;
      result.estimateSourceGasUsd = ett.estimateSourceGasUsd;

      result.sendParam = {
        transaction: operatorTx,
        versionedTx,
      };

      // Calculate total fees
      for (const feeKey in result.fees) {
        if (excludeFees && excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
          continue;
        }
        result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
      }
      result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd || 0).toFixed(20));

      execTime.logTotal("quoteCCTP");

      return result;
    } catch (error: any) {
      this.csl("Solana quoteCCTP", "red-500", "quoteCCTP failed: %o", error);
      return { errMsg: error.message };
    }
  }

  async createAssociatedTokenAddress(params: any) {
    const {
      tokenMint,
    } = params;

    const connection = this.getConnection();

    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    const ownerPubkey = this.publicKey;
    const mint = new PublicKey(tokenMint);
    const associatedTokenAccount = getAssociatedTokenAddressSync(mint, ownerPubkey);

    this.csl("Solana createAssociatedTokenAddress", "purple-400", "associatedTokenAccount: %o", associatedTokenAccount);

    const createTokenAccount = async () => {
      const transaction = new Transaction();

      transaction.add(
        createAssociatedTokenAccountInstruction(
          ownerPubkey,
          associatedTokenAccount,
          ownerPubkey,
          mint
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      const signedTransaction = await this.signTransaction(transaction);

      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.checkTransactionStatus(signature);

      return associatedTokenAccount;
    };

    try {
      const accountRes = await getAccount(connection, associatedTokenAccount);
      this.csl("Solana createAssociatedTokenAddress", "purple-400", "associatedTokenAccount account: %o", accountRes);
      return associatedTokenAccount;
    } catch (error) {
      this.csl("Solana createAssociatedTokenAddress", "red-500", "get ata failed: %o", error);
    }

    return createTokenAccount();
  }

  async quoteFraxZero(params: any) {
    const {
      dry,
      recipient,
      amountWei,
      slippageTolerance,
      fromToken,
      toToken,
      prices,
      excludeFees,
      refundTo,
      originLayerzero,
      destinationLayerzero,
    } = params;

    const connection = this.getConnection();

    const execTime = new ExecTime({ type: "FraxZero Solana", logStyle: "fuchsia-400", isDebug: OpenAPI.DEBUG });

    this.csl("Solana quoteFraxZero", "purple-500", "params: %o", params);
    const result: any = {
      needApprove: false,
      approveSpender: void 0,
      sendParam: void 0,
      quoteParam: {
        ...params,
      },
      fees: {},
      totalFeesUsd: 0,
      estimateSourceGas: 0n,
      totalEstimateSourceGas: 0n,
      estimateSourceGasUsd: 0,
      estimateTime: 0,
      outputAmount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** params.fromToken.decimals).toFixed(params.fromToken.decimals, 0)),
    };

    const sender = this.publicKey!;
    const userPubkey = fromWeb3JsPublicKey(new PublicKey(refundTo || sender.toString()));
    const {
      eid: srcEid,
      remoteHop,
      lockbox,
    } = originLayerzero;
    const {
      eid: dstEid,
    } = destinationLayerzero;

    const availableRpcUrl = await getAvailableSolanaRpcUrl({ isQuerySignature: true });

    const ALT_ADDRESS = new PublicKey("AokBxha6VMLLgf97B5VYHEtqztamWmYERBmmFvjuTzJB");
    const umi = createUmi(availableRpcUrl, "confirmed").use(mplToolbox());
    const oftProgramId = publicKey(originLayerzero.programId);
    const oftMint = publicKey(fromToken.contractAddress);
    const oftEscrow = publicKey(originLayerzero.escrow);
    const tokenProgramId = publicKey(TOKEN_PROGRAM_ID);
    const tokenAccount = findAssociatedTokenPda(umi, {
      mint: oftMint,
      owner: userPubkey,
      tokenProgramId,
    });

    execTime.breakpoint();
    await safeFetchToken(umi, tokenAccount[0]);
    execTime.log("safeFetchToken");

    const recipientAddressBytes32 = addressToBytes32(toToken.chainType, recipient);
    const amountLd = BigInt(amountWei);
    const minAmountLd = (amountLd * 99n) / 100n;

    execTime.breakpoint();
    const { value: lookupTableAccount } = await connection.getAddressLookupTable(ALT_ADDRESS);
    execTime.log("getAddressLookupTable", "ALT_ADDRESS: %o, lookupTableAccount: %o", ALT_ADDRESS, lookupTableAccount);
    if (!lookupTableAccount) {
      throw new Error("ALT not found");
    }

    execTime.breakpoint();
    let { nativeFee, lzTokenFee } = await oft.quote(
      umi.rpc,
      {
        payer: userPubkey,
        tokenMint: oftMint,
        tokenEscrow: oftEscrow,
      },
      {
        payInLzToken: false,
        to: getBytes(recipientAddressBytes32),
        dstEid: dstEid,
        amountLd,
        minAmountLd,
        options: Buffer.from(""),
        composeMsg: undefined,
      },
      {
        oft: oftProgramId,
      },
    );
    execTime.log("oft.quote", "nativeFee: %s, lzTokenFee: %s", nativeFee, lzTokenFee);
    nativeFee = nativeFee * NATIVE_MSG_FEE_BUFFER / 100n;
    this.csl("Solana quoteFraxZero", "purple-500", "nativeFee after buffer: %o", nativeFee);

    // oft.send() internally simulates the tx via umi.rpc without replaceRecentBlockhash,
    // so it can transiently fail with BlockhashNotFound when RPC nodes are out of sync.
    execTime.breakpoint();
    let ix: Awaited<ReturnType<typeof oft.send>>;
    let oftSendRetries = 0;
    const OFT_SEND_MAX_RETRIES = 3;
    while (true) {
      try {
        ix = await oft.send(
          umi.rpc,
          {
            payer: {
              ...this.signer,
              publicKey: userPubkey,
            },
            tokenMint: oftMint,
            tokenEscrow: oftEscrow,
            tokenSource: tokenAccount[0],
          },
          {
            to: getBytes(recipientAddressBytes32),
            dstEid,
            amountLd,
            minAmountLd,
            options: Buffer.from(''),
            composeMsg: undefined,
            nativeFee,
            lzTokenFee: 0n,
          },
          {
            oft: oftProgramId,
            token: tokenProgramId,
          },
        );
        break;
      } catch (err: any) {
        const isBlockhashNotFound =
          err?.message?.includes('BlockhashNotFound') ||
          JSON.stringify(err)?.includes('BlockhashNotFound');
        if (isBlockhashNotFound && oftSendRetries < OFT_SEND_MAX_RETRIES) {
          oftSendRetries++;
          this.csl("Solana quoteFraxZero", "yellow-500", "oft.send BlockhashNotFound, retrying (%o/%o)...", oftSendRetries, OFT_SEND_MAX_RETRIES);
          await new Promise((r) => setTimeout(r, 500 * oftSendRetries));
          continue;
        }
        throw err;
      }
    }

    execTime.log("oft.senbd", "oft send retry times: %s", oftSendRetries);
    this.csl("Solana quoteFraxZero", "purple-500", "ix: %o", ix);

    const web3Instruction = toWeb3JsInstruction(ix.instruction);
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 400000, // Increase to 400k units (default is 200k)
    });
    execTime.breakpoint();
    const { blockhash } = await connection.getLatestBlockhash();
    execTime.log("getLatestBlockhash");
    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(userPubkey),
      recentBlockhash: blockhash,
      instructions: [computeBudgetIx, web3Instruction],
    }).compileToV0Message([lookupTableAccount]);
    const transaction = new VersionedTransaction(messageV0);

    this.csl("Solana quoteFraxZero", "purple-500", "transaction: %o", transaction);

    result.sendParam = {
      transaction,
      versionedTx: transaction,
    };

    execTime.breakpoint();
    const ett = await this.estimateTransaction({
      dry,
      versionedTx: transaction,
      fromToken,
      prices,
    });
    execTime.log("estimateTransaction");

    const nativeFeeUsd = Big(nativeFee.toString())
      .div(10 ** fromToken.nativeToken.decimals)
      .times(getPrice(prices, fromToken.nativeToken.symbol));
    result.fees.nativeFeeUsd = numberRemoveEndZero(nativeFeeUsd.toFixed(20));

    const lzTokenFeeUsd = Big(lzTokenFee ? lzTokenFee.toString() : 0)
      .div(10 ** fromToken.decimals)
      .times(getPrice(prices, fromToken.symbol));
    result.fees.lzTokenFeeUsd = numberRemoveEndZero(lzTokenFeeUsd.toFixed(20));

    result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
    result.estimateSourceGasUsd = ett.estimateSourceGasUsd;
    result.estimateSourceGas = ett.estimateSourceGas;
    result.totalEstimateSourceGas = ett.estimateSourceGas + nativeFee;

    result.fees.nativeFee = Big(nativeFee.toString())
      .div(10 ** fromToken.nativeToken.decimals)
      .toFixed(fromToken.nativeToken.decimals, 0);
    result.fees.lzTokenFee = lzTokenFee.toString();

    for (const feeKey in result.fees) {
      if (excludeFees && excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
        continue;
      }
      result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
    }
    result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd || 0).toFixed(20));

    execTime.logTotal("quoteFraxZero");

    return result;
  }
}

export { SolanaWallet };
