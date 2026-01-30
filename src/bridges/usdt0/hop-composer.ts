import { ethers } from "ethers";
import { USDT0_CONFIG } from "./config";
import { OFT_ABI } from "./contract";
import { getRpcUrls } from "../../wallets/config/rpcs";

export const getHopMsgFee = async (params: any) => {
  const {
    sendParam,
    toToken,
  } = params;

  const originLayerzero = USDT0_CONFIG["Arbitrum"];
  const destinationLayerzero = USDT0_CONFIG[toToken.chainName];

  let arbitrumOft = originLayerzero.oft;
  let destinationLayerzeroAddress = destinationLayerzero.oft || destinationLayerzero.oftLegacy;
  const isDestinationLegacy = destinationLayerzeroAddress === destinationLayerzero.oftLegacy;
  if (isDestinationLegacy) {
    arbitrumOft = originLayerzero.oftLegacy || originLayerzero.oft;
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrls("arb")[0]);
  const oftContractRead = new ethers.Contract(arbitrumOft, OFT_ABI, provider);

  try {
    const msgFee = await oftContractRead.quoteSend.staticCall(sendParam, false);

    const [nativeFee] = msgFee;

    // 20% buffer
    return nativeFee * 120n / 100n;
  } catch (error) {
    console.log("getHopMsgFee failed: %o", error);
    throw new Error("Quote multi hop message fee failed");
  }
};
