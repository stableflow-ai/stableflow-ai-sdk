import { USDT0_CONFIG, USDT0_DVN_COUNT } from "./config";
import { OFT_ABI, SOLANA_IDL } from "./contract";
import { SendType } from "../../core/Send";
import { Service } from "../../core/Service";
import { OpenAPI } from '../../core/OpenAPI';
import { request } from '../../core/request';

export const PayInLzToken = false;

const excludeFees: string[] = ["estimateGasUsd"];

/**
 * Calculate USDT0 cross-chain estimated time using LayerZero formula
 * Formula: Total Time ≈ (sourceBlockTime × blockConfirmations) + (destinationBlockTime × (2 blocks + DVN count))
 * 
 * @param originChain Source chain name (e.g., "Ethereum", "Arbitrum")
 * @param destinationChain Destination chain name
 * @returns Estimated time in seconds, returns default value 32 if config is missing
 */
function calculateEstimateTime(originChain: string, destinationChain: string): number {
  const originConfig = USDT0_CONFIG[originChain];
  const destinationConfig = USDT0_CONFIG[destinationChain];

  // Return default value if config is missing
  if (!originConfig || !destinationConfig) {
    console.warn(`Missing config for chains: origin=${originChain}, destination=${destinationChain}, using default 32s`);
    return 32;
  }

  // Validate required configuration fields
  if (
    typeof originConfig.blockTime !== 'number' ||
    typeof originConfig.confirmations !== 'number' ||
    typeof destinationConfig.blockTime !== 'number'
  ) {
    console.warn(`Invalid config for chains: origin=${originChain}, destination=${destinationChain}, using default 32s`);
    return 32;
  }

  const sourceBlockTime = originConfig.blockTime;
  const blockConfirmations = originConfig.confirmations;
  const destinationBlockTime = destinationConfig.blockTime;
  const dvnCount = USDT0_DVN_COUNT;

  // Calculate: source chain part + destination chain part
  const sourceTime = sourceBlockTime * blockConfirmations;
  const destinationTime = destinationBlockTime * (2 + dvnCount);
  const totalTime = Math.ceil(sourceTime + destinationTime);

  console.log(`USDT0 estimate time calculation:`, {
    originChain,
    destinationChain,
    sourceBlockTime,
    blockConfirmations,
    destinationBlockTime,
    dvnCount,
    sourceTime,
    destinationTime,
    totalTime,
  });

  return totalTime;
}

class Usdt0Service {
  public async quote(params: any) {
    const {
      wallet,
      originChain,
      destinationChain,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
    } = params;

    const originLayerzero = USDT0_CONFIG[originChain];
    const destinationLayerzero = USDT0_CONFIG[destinationChain];

    let originLayerzeroAddress = originLayerzero.oft;
    let destinationLayerzeroAddress = destinationLayerzero.oft;
    let dstEid = destinationLayerzero.eid;

    // Dynamically calculate estimated time
    const estimateTime = calculateEstimateTime(originChain, destinationChain);

    if (fromToken.chainType === "evm") {
      destinationLayerzeroAddress = destinationLayerzero.oft || destinationLayerzero.oftLegacy;
      let isOriginLegacy = false;
      const isDestinationLegacy = destinationLayerzeroAddress === destinationLayerzero.oftLegacy;
      if (isDestinationLegacy) {
        originLayerzeroAddress = originLayerzero.oftLegacy || originLayerzero.oft;
        isOriginLegacy = originLayerzeroAddress === originLayerzero.oftLegacy;
      }
      const isBothLegacy = isOriginLegacy && isDestinationLegacy;
      const isBothOUpgradeable = !isOriginLegacy && !isDestinationLegacy;
      const isMultiHopComposer = !isBothLegacy && !isBothOUpgradeable;

      const result = await wallet.quote(Service.Usdt0, {
        abi: OFT_ABI,
        dstEid,
        refundTo,
        recipient,
        amountWei,
        slippageTolerance,
        payInLzToken: PayInLzToken,
        fromToken,
        toToken,
        prices,
        originLayerzeroAddress,
        destinationLayerzeroAddress,
        excludeFees,
        multiHopComposer: USDT0_CONFIG["Arbitrum"],
        isMultiHopComposer,
        isOriginLegacy,
        isDestinationLegacy,
      });

      result.estimateTime = estimateTime;

      return result;
    }

    // source chain must be legacy
    const isOriginLegacy = true;
    originLayerzeroAddress = originLayerzero.oftLegacy;
    destinationLayerzeroAddress = destinationLayerzero.oftLegacy || destinationLayerzero.oft;
    const isDestinationLegacy = destinationLayerzeroAddress === destinationLayerzero.oftLegacy;
    const isBothLegacy = isOriginLegacy && isDestinationLegacy;
    const isMultiHopComposer = !isBothLegacy;
    console.log("isMultiHopComposer: %o", isMultiHopComposer);

    // one is legacy, and one is upgradeable
    // should use multi hop composer
    // and special extraOptions & composeMsg
    if (isMultiHopComposer) {
      dstEid = USDT0_CONFIG["Arbitrum"].eid;
      destinationLayerzeroAddress = USDT0_CONFIG["Arbitrum"].oftMultiHopComposer;
    }

    if (fromToken.chainType === "tron") {
      const result = await wallet.quote(Service.Usdt0, {
        abi: OFT_ABI,
        dstEid: destinationLayerzero.eid,
        refundTo,
        recipient,
        amountWei,
        slippageTolerance,
        payInLzToken: PayInLzToken,
        fromToken,
        toToken,
        prices,
        originLayerzeroAddress,
        destinationLayerzeroAddress,
        excludeFees,
        multiHopComposer: USDT0_CONFIG["Arbitrum"],
        isMultiHopComposer,
        isOriginLegacy,
        isDestinationLegacy,
      });

      result.estimateTime = estimateTime;

      return result;
    }

    if (fromToken.chainType === "sol") {
      const result = await wallet.quote(Service.Usdt0, {
        idl: SOLANA_IDL,
        dstEid: destinationLayerzero.eid,
        refundTo,
        recipient,
        amountWei,
        slippageTolerance,
        payInLzToken: PayInLzToken,
        fromToken,
        toToken,
        prices,
        originLayerzeroAddress,
        destinationLayerzeroAddress,
        excludeFees,
        multiHopComposer: USDT0_CONFIG["Arbitrum"],
        isMultiHopComposer,
        isOriginLegacy,
        isDestinationLegacy,
      });

      return result;
    }
  }

  public async send(params: any) {
    const {
      wallet,
      ...rest
    } = params;

    return wallet.send(SendType.SEND, rest);
  }

  public async getStatus(params: any) {
    return request(OpenAPI, {
      method: 'GET',
      url: `/v0/messages/tx/${params.hash}`,
      headers: {
        "Content-Type": "application/json"
      },
      errors: {
        400: `Bad Request - Invalid input data`,
        401: `Unauthorized - JWT token is invalid`,
      },
    });
  }
}

export default new Usdt0Service();
