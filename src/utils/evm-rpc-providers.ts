import { ethers } from "ethers";
import { TokenConfig } from "../models/Token";

const providerCache = new Map<number, ethers.AbstractProvider>();

class SequentialFallbackProvider extends ethers.AbstractProvider {
  private providers: ethers.JsonRpcProvider[];

  constructor(providers: ethers.JsonRpcProvider[], chainId: number) {
    super(chainId);
    this.providers = providers;
  }

  async _detectNetwork(): Promise<ethers.Network> {
    return this.providers[0]._detectNetwork();
  }

  async _perform(req: ethers.PerformActionRequest): Promise<any> {
    let lastError: unknown;
    for (const provider of this.providers) {
      try {
        return await provider._perform(req);
      } catch (err) {
        if (ethers.isError(err, "CALL_EXCEPTION")) throw err;
        lastError = err;
      }
    }
    throw lastError;
  }
}

export function evmRpcFallbackProvider(chain: TokenConfig) {
  const { rpcUrls, chainId } = chain;

  if (providerCache.has(chainId!)) {
    return providerCache.get(chainId!)!;
  }

  const providers = rpcUrls.map(
    (rpc: string) => {
      return new ethers.JsonRpcProvider(rpc, chainId, { staticNetwork: true });
    }
  );

  const provider =
    providers.length === 1
      ? providers[0]
      : new SequentialFallbackProvider(providers, chainId!);

  providerCache.set(chainId!, provider);
  return provider;
}
