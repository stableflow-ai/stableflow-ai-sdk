import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
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
import { Service, type ServiceType } from "../core/Service";
import cctpService from "../bridges/cctp";
import { chainsRpcUrls } from "./config/rpcs";

export default class SolanaWallet {
  connection: Connection;
  private publicKey: PublicKey | null;
  private signTransaction: any;
  private signer: any;

  constructor(options: { publicKey: PublicKey | null; signer: any }) {
    this.connection = new Connection(chainsRpcUrls["Solana"], "confirmed");
    this.publicKey = options.publicKey;
    this.signTransaction = options.signer.signTransaction;
    this.signer = options.signer;
  }

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

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signedTransaction = await this.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    await this.connection.confirmTransaction(signature);
    return signature;
  }

  // Transfer SPL token
  async transferToken(tokenMint: string, to: string, amount: string) {
    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    const fromPubkey = this.publicKey;
    const toPubkey = new PublicKey(to);
    const mint = new PublicKey(tokenMint);

    // Get associated token account addresses
    const fromTokenAccount = getAssociatedTokenAddressSync(mint, fromPubkey);
    const toTokenAccount = getAssociatedTokenAddressSync(mint, toPubkey);

    const transaction = new Transaction();

    // Check if recipient has token account, create if not
    try {
      await getAccount(this.connection, toTokenAccount);
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

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signedTransaction = await this.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    await this.connection.confirmTransaction(signature);

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

  async getSOLBalance(account: string) {
    const publicKey = new PublicKey(account);
    const balance = await this.connection.getBalance(publicKey);
    return balance;
  }

  async getTokenBalance(tokenMint: string, account: string) {
    const mint = new PublicKey(tokenMint);
    const owner = new PublicKey(account);

    try {
      const tokenAccount = await getAssociatedTokenAddress(mint, owner);

      const accountInfo = await getAccount(this.connection, tokenAccount);

      return accountInfo.amount;
    } catch (error: any) {
      if (error.message.includes("could not find account")) {
        return 0;
      }
      throw error;
    }
  }

  async getBalance(token: any, account: string) {
    if (
      token.symbol === "SOL" ||
      token.symbol === "sol" ||
      token.symbol === "native"
    ) {
      return await this.getSOLBalance(account);
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
    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Solana transaction fees are typically fixed at 5000 lamports per signature
    // Base fee per signature: 5000 lamports
    let estimatedFee = 5000n;

    const { originAsset, depositAddress } = data;

    // Check if token account creation is needed for SPL tokens
    if (originAsset !== "SOL" && originAsset !== "sol") {
      const mint = new PublicKey(originAsset);
      const toPubkey = new PublicKey(depositAddress);
      const toTokenAccount = getAssociatedTokenAddressSync(mint, toPubkey);

      // Check if recipient has token account
      try {
        await getAccount(this.connection, toTokenAccount);
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

  async checkTransactionStatus(signature: string) {
    const maxAttempts = 30;
    const interval = 4000;
    let timer: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const tx = await this.connection.getTransaction(signature, {
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
          console.log(
            `polling attempt ${attempt}/${maxAttempts}: transaction not confirmed...`
          );
        }
      } catch (error: any) {
        console.log("checkTransactionStatus failed:", error.message);
      }

      await new Promise((resolve) => {
        timer = setTimeout(() => {
          clearTimeout(timer);
          resolve(true);
        }, interval);
      });
    }

    console.log("checkTransactionStatus failed: timeout");
    return false;
  }

  async simulateIx(ix: any) {
    const tx = new Transaction().add(ix);

    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = this.publicKey!;

    // Convert Transaction to VersionedTransaction to use config options
    const message = tx.compileMessage();
    const versionedTx = new VersionedTransaction(message);

    const sim = await this.connection.simulateTransaction(versionedTx, {
      // commitment: "confirmed",
      sigVerify: false
    });

    if (sim.value.err) console.error("Error:", sim.value.err);

    console.log("sim: %o", sim);

    return sim.value;
  }

  async sendTransaction(params: any) {
    const { transaction } = params;

    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    if (!transaction) {
      throw new Error("Transaction is required");
    }

    // Sign the transaction
    const signedTransaction = await this.signTransaction(transaction);

    // Send the transaction
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3
      }
    );

    // Confirm the transaction
    const confirmation = await this.connection.confirmTransaction(
      signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(
        `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
      );
    }

    return signature;
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
      fromToken,
      amountWei,
      prices,
      depositAddress,
    } = params;

    try {
      const result: any = { fees: {} };

      const PROGRAM_ID = new PublicKey(proxyAddress);
      const STATE_PDA = new PublicKey("9E8az3Y9sdXvM2f3CCH6c9N3iFyNfDryQCZhqDxRYGUw");
      const MINT = new PublicKey(fromToken.contractAddress);
      const AMOUNT = new BN(amountWei);
      const RECIPIENT = new PublicKey(depositAddress);
      const sender = this.publicKey!;

      // Create AnchorProvider
      const provider = new AnchorProvider(this.connection, this.signer, {
        commitment: "confirmed"
      });

      // Create Program instance
      const program = new Program<any>(stableflowProxyIdl, PROGRAM_ID, provider);

      // Get user's token account (ATA)
      const userTokenAccount = getAssociatedTokenAddressSync(MINT, sender);

      // Get recipient's token account (ATA)
      const toTokenAccount = getAssociatedTokenAddressSync(MINT, RECIPIENT);

      // Check if recipient's token account exists, create if not
      const transaction = new Transaction();
      try {
        await getAccount(this.connection, toTokenAccount);
      } catch (error) {
        // If token account doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            sender, // payer
            toTokenAccount, // ata
            RECIPIENT, // owner
            MINT // mint
          )
        );
      }

      // Build transfer instruction
      const transferInstruction = await program.methods
        .transfer(AMOUNT)
        .accounts({
          stableFlowState: STATE_PDA,
          tokenMint: MINT,
          userTokenAccount: userTokenAccount,
          toTokenAccount: toTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          user: sender,
          toUser: RECIPIENT,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Add transfer instruction to transaction
      transaction.add(transferInstruction);

      // Set transaction blockhash and feePayer before simulation
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sender;

      // Simulate entire transaction (including account creation if needed) to estimate fees
      const message = transaction.compileMessage();
      const versionedTx = new VersionedTransaction(message);
      const simulation = await this.connection.simulateTransaction(versionedTx, {
        sigVerify: false
      });

      result.sendParam = {
        transaction,
      };

      // @ts-ignore Calculate estimated fee
      const estimatedFee = simulation.value.fee || 5000n; // Base fee per signature

      // Convert fee to USD
      const estimateGasUsd = Big(estimatedFee.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .times(getPrice(prices, fromToken.nativeToken.symbol));

      const usd = numberRemoveEndZero(estimateGasUsd.toFixed(20));
      const wei = estimatedFee;

      // Assign fee values to result
      result.fees.sourceGasFeeUsd = usd;
      result.estimateSourceGas = wei;
      result.estimateSourceGasUsd = usd;

      return result;
    } catch (error: any) {
      console.log("error: %o", error);
      return { errMsg: error.message };
    }
  }

  async quoteCCTP(params: any) {
    const {
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
        estimateSourceGasUsd: void 0,
        estimateTime: 0,
        outputAmount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
      };

      const PROGRAM_ID = new PublicKey(proxyAddress);
      const MINT = new PublicKey(fromToken.contractAddress);
      const sender = this.publicKey!;
      const userPubkey = new PublicKey(refundTo || sender.toString());

      // Derive UserState PDA
      const [userStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), userPubkey.toBuffer()],
        PROGRAM_ID
      );

      // Get user nonce from UserState account, useless
      let userNonce = 0;
      try {
        const accountInfo = await this.connection.getAccountInfo(userStatePda);
        if (accountInfo && accountInfo.data) {
          // UserState structure: user (32 bytes) + nonce (8 bytes) + bump (1 byte)
          // Skip user (32 bytes) and read nonce (8 bytes, little-endian)
          const nonceBuffer = accountInfo.data.slice(32, 40);
          userNonce = Number(new BN(nonceBuffer, "le").toString());
        }
      } catch (error) {
        // If UserState doesn't exist, nonce is 0
        console.log("UserState not found, using nonce 0");
      }

      // Get user's token account (ATA)
      const userTokenAccount = getAssociatedTokenAddressSync(MINT, sender);

      // Quote signature
      const signatureRes: any = await cctpService.quoteSignature({
        address: userPubkey.toString(),
        amount: numberRemoveEndZero(Big(amountWei || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0)),
        destination_domain_id: destinationDomain,
        receipt_address: recipient,
        source_domain_id: sourceDomain,
        // user_nonce: userNonce,
        ata_address: userTokenAccount,
      });

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
        console.log('❌ Signature verification failed');
      } else {
        // console.log('✅ Signature verification success');
      }

      // Simulate entire transaction (including account creation if needed) to estimate fees
      const message = operatorTx.compileMessage();
      const versionedTx = new VersionedTransaction(message);
      const simulation = await this.connection.simulateTransaction(versionedTx, {
        sigVerify: false
      });
      // console.log("depositWithFee simulation: %o", JSON.stringify(simulation.value));

      // Estimate gas cost (Solana fees are typically fixed, but we can use simulation)
      // @ts-ignore Solana base fee is 5000 lamports per signature
      const estimatedFee = simulation.value.fee || 5000n; // Base fee per signature
      const estimateGasUsd = Big(estimatedFee.toString())
        .div(10 ** fromToken.nativeToken.decimals)
        .times(getPrice(prices, fromToken.nativeToken.symbol));
      result.fees.estimateDepositGasUsd = numberRemoveEndZero(estimateGasUsd.toFixed(20));
      result.estimateSourceGas = estimatedFee;
      result.estimateSourceGasUsd = numberRemoveEndZero(estimateGasUsd.toFixed(20));

      result.sendParam = {
        transaction: operatorTx,
      };

      // Calculate total fees
      for (const feeKey in result.fees) {
        if (excludeFees && excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
          continue;
        }
        result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
      }
      result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd || 0).toFixed(20));

      return result;
    } catch (error: any) {
      console.log("quoteCCTP failed: %o", error);
      return { errMsg: error.message };
    }
  }

  async createAssociatedTokenAddress(params: any) {
    const {
      tokenMint,
    } = params;

    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }

    const ownerPubkey = this.publicKey;
    const mint = new PublicKey(tokenMint);
    const associatedTokenAccount = getAssociatedTokenAddressSync(mint, ownerPubkey);

    console.log("associatedTokenAccount: %o", associatedTokenAccount);

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

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      const signedTransaction = await this.signTransaction(transaction);

      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.checkTransactionStatus(signature);

      return associatedTokenAccount;
    };

    try {
      const accountRes = await getAccount(this.connection, associatedTokenAccount);
      console.log("associatedTokenAccount account: %o", accountRes);
      return associatedTokenAccount;
    } catch (error) {
      console.log("get ata failed: %o", error);
    }

    return createTokenAccount();
  }
}

export { SolanaWallet };
