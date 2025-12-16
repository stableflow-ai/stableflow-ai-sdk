import React, { useEffect, useState } from "react";
import useWalletsStore from "@/stores/use-wallets";
import { useDebounceFn } from "../hooks/useDebounceFn";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useWalletSelector } from "./hooks/use-wallet-selector";
import WalletSelector from "./components/wallet-selector";

import { AptosWallet } from 'stableflow-ai-sdk';

export default function AptosProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ network: Network.MAINNET }}
      onError={(error) => {
        console.log("error", error);
      }}
      optInWallets={[
        "OKX Wallet",
        "Petra",
        "Nightly",
        "Pontem Wallet",
        "Backpack",
        "MSafe",
        "Bitget Wallet",
        "Gate Wallet",
      ]}
    >
      {children} <Content />
    </AptosWalletAdapterProvider>
  );
}

const Content = () => {
  const [mounted, setMounted] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);
  const {
    account,
    connect,
    disconnect,
    signAndSubmitTransaction,
    wallet,
    wallets,
    notDetectedWallets,
  } = useWallet();

  // Wallet selector
  const {
    open,
    onClose,
    onOpen,
    onConnect,
    isConnecting,
  } = useWalletSelector({
    connect: async (wallet: any) => {
      await connect(wallet.name);
    },
  });

  const { run: connect2AptosWallets } = useDebounceFn(() => {
    if (!mounted) return;
    const aptosWallet = new AptosWallet({
      account: account || null,
      signAndSubmitTransaction,
    });
    setWallets({
      aptos: {
        account: account?.address.toString() || null,
        wallet: aptosWallet,
        walletIcon: wallet?.icon,
        connect: () => {
          if (wallet) {
            onConnect(wallet.name);
          } else {
            onOpen();
          }
        },
        disconnect: () => {
          disconnect();
          setWallets({
            aptos: {
              account: null,
              wallet: null,
              connect: () => { },
              disconnect: () => { }
            }
          });
        }
      }
    });
  }, { wait: 500 });

  useEffect(() => {
    connect2AptosWallets();
  }, [account, mounted]);

  const { run: connectDelay } = useDebounceFn(() => {
    if (!wallet) {
      return;
    }
    onConnect(wallet.name);
  }, { wait: 500 });

  useEffect(() => {
    connectDelay();
  }, [wallet]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WalletSelector
      open={open}
      onClose={onClose}
      onConnect={onConnect}
      isConnecting={isConnecting}
      wallets={[...wallets, ...notDetectedWallets]}
      readyState={{ key: "readyState", value: "Installed" }}
      title="Select Aptos Wallet"
    />
  );
};
