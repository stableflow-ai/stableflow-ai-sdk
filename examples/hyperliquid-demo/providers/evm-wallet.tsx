"use client";

import React, { createContext, useContext, useState } from "react";
import { EVMWallet, tokens } from 'stableflow-ai-sdk';
import { Chain } from "viem";
import { useAccount, useSwitchChain } from "wagmi";

interface IEVMWallet {
  account?: string | null;
  chainId?: number;
  wallet?: EVMWallet | null;
  connect?: () => void;
  disconnect?: () => void;
}

interface IEVMWalletContext {
  wallet: IEVMWallet;
  setWallet: (wallet: IEVMWallet) => void;
  currentChain?: { logo?: string } & Chain;
  currentChainId?: number;
  onSwitchChain?: ({ chainId }: { chainId: number; }) => Promise<any>;
}

const EVMWalletContext = createContext<IEVMWalletContext>({
  wallet: {},
  setWallet: () => { },
});

function EVMWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<IEVMWallet>({});
  const { chain, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const _currentChain = tokens.find((token) => token.chainId === chainId);

  return (
    <EVMWalletContext.Provider
      value={{
        wallet,
        setWallet,
        currentChain: {
          ...chain,
          logo: _currentChain?.chainIcon,
        } as { logo?: string } & Chain,
        currentChainId: chainId,
        onSwitchChain: switchChainAsync,
      }}>
      {children}
    </EVMWalletContext.Provider>
  );
}

export default EVMWalletProvider;

export const useEVMWallet = () => {
  return useContext(EVMWalletContext);
};
