import React, { useEffect, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import useWalletsStore from "@/stores/use-wallets";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDebounceFn } from "../hooks/useDebounceFn";

import { SolanaWallet } from 'stableflow-ai-sdk';

export const adapters = [
  new PhantomWalletAdapter(),
];

export default function SolanaProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectionProvider endpoint="https://rpc.ankr.com/solana">
      <WalletProvider wallets={adapters} autoConnect={false}>
        <WalletModalProvider>
          {children} <Content />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

const Content = () => {
  const [mounted, setMounted] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);
  const walletAdapter = useWallet();
  const { publicKey, disconnect, connect, wallet } = walletAdapter;
  const { setVisible } = useWalletModal();

  const { run: connect2SolanaWallets } = useDebounceFn(() => {
    if (!mounted) return;
    const solanaWallet = new SolanaWallet({
      publicKey,
      signer: walletAdapter,
    });
    setWallets({
      sol: {
        account: publicKey?.toString() || null,
        wallet: solanaWallet,
        walletIcon: wallet?.adapter.icon,
        connect: () => {
          if (wallet) {
            connect();
          } else {
            setVisible?.(true);
          }
        },
        disconnect: () => {
          disconnect();
          setWallets({
            sol: {
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
    connect2SolanaWallets();
  }, [publicKey, mounted]);

  const { run: connectDelay } = useDebounceFn(() => {
    if (!wallet) {
      return;
    }
    connect();
  }, { wait: 500 });

  useEffect(() => {
    connectDelay();
  }, [wallet]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return null;
};
