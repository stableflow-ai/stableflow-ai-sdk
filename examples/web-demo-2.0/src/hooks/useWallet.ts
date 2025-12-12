import { useMemo } from 'react';
import useWalletsStore from '@/stores/use-wallets';
import { TokenConfig } from 'stableflow-ai-sdk';
import { useSwitchChain } from 'wagmi';

interface UseWalletResult {
  address?: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  chainType: string | null;
  wallet?: any;
  switchNetwork: (fromChain: TokenConfig) => void;
}

export const useWallet = (chain?: TokenConfig | null): UseWalletResult => {
  const wallets: any = useWalletsStore();
  const wallet = useMemo(() => {
    if (!chain) return void 0;
    return wallets[chain.chainType];
  }, [chain, wallets]);
  const [address, isConnected] = useMemo(() => {
    return [
      wallet?.account,
      !!wallet?.account,
    ];
  }, [wallet]);

  const connect = async () => {
    if (!chain) return;

    if (!wallet) {
      throw new Error(`${chain.chainType} wallet provider not found`);
    }

    wallet.connect();
  };

  const disconnect = async () => {
    if (!chain) return;

    if (!wallet) {
      throw new Error(`${chain.chainType} wallet provider not found`);
    }

    wallet.disconnect();
  };

  const { switchChain } = useSwitchChain();
  const switchNetwork = (fromChain: TokenConfig) => {
    if (fromChain?.chainType !== "evm" || !fromChain.chainId) return;

    switchChain({ chainId: fromChain.chainId });
  };

  return {
    wallet,
    address,
    isConnected,
    connect,
    disconnect,
    chainType: chain?.chainType || null,
    switchNetwork,
  };
};

