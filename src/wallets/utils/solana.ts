import { getRpcUrls } from "../config/rpcs";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export const getDestinationAssociatedTokenAddress = async (params: any) => {
  const {
    recipient,
    toToken,
  } = params;

  const result = {
    needCreateTokenAccount: false,
    associatedTokenAddress: "",
  };

  if (toToken.chainType !== "sol") {
    return result;
  }

  try {
    const connection = new Connection(getRpcUrls("sol")[0]);
    const wallet = new PublicKey(recipient);
    const TOKEN_MINT = new PublicKey(toToken.contractAddress);

    const ata = getAssociatedTokenAddressSync(TOKEN_MINT, wallet);

    const accountInfo = await connection.getAccountInfo(ata);

    console.log("accountInfo: %o", accountInfo);

    if (!accountInfo) {
      result.needCreateTokenAccount = true;
      return result;
    }

    result.associatedTokenAddress = ata.toBase58();
  } catch (error) {
    console.log("getDestinationAssociatedTokenAddress failed: %o", error);
  }

  return result;
};
