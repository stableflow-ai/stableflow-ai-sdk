import useWalletsStore from "@/stores/use-wallets";
import useWalletStore from "@/stores/use-wallet";
import { useEffect, useRef, useState } from "react";
import WalletSelector from "./components/wallet-selector";
import { OkxWalletAdapter, TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import { useWalletSelector } from "./hooks/use-wallet-selector";
import { TronWeb } from "tronweb";

import { TronWallet, getRpcUrls } from 'stableflow-ai-sdk';

const wallets = [new TronLinkAdapter(), new OkxWalletAdapter()];

export default function TronProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Content />
    </>
  );
}

const Content = () => {
  const setWallets = useWalletsStore((state) => state.set);
  const tronWalletAdapter = useWalletStore((state) => state.tronWalletAdapter);
  const setWalletStore = useWalletStore((state) => state.set);
  const [adapter, setAdapter] = useState<any>(null);
  const walletRef = useRef<TronWallet | null>(null);

  // Wallet selector
  const {
    open,
    onClose,
    onOpen,
    onConnect,
    isConnecting,
  } = useWalletSelector({
    connect: async (wallet: any) => {
      await wallet.connect(wallet);
      setAdapter(wallet);
    },
  });

  useEffect(() => {
    // Restore previously saved adapter (only exists if user hasn't actively disconnected)
    if (tronWalletAdapter) {
      const savedAdapter = wallets.find((wallet) => wallet.name === tronWalletAdapter);
      if (savedAdapter) {
        setAdapter(savedAdapter);
      }
    }
  }, []);

  const setWindowWallet = (address?: string) => {
    const _address = address || adapter.address;
    const _tronWeb = new TronWeb({
      fullHost: getRpcUrls("tron")[0],
      headers: {},
      privateKey: "",
    });
    _address && _tronWeb.setAddress(_address);
    walletRef.current = new TronWallet({
      signAndSendTransaction: async (transaction: any) => {
        const signedTx = await adapter.signTransaction(transaction);
        const result = await _tronWeb.trx.sendRawTransaction(signedTx);
        return result.txid;
      },
      address: _address,
    });
  };

  useEffect(() => {
    if (!adapter) {
      setWallets({
        tron: {
          wallet: walletRef.current,
          connect: () => {
            onOpen();
          }
        }
      });
      return;
    }

    setWindowWallet();

    setWalletStore({
      tronWalletAdapter: adapter.name
    });

    const params = {
      connect: async () => {
        try {
          onOpen();
        } catch (error) {
          console.error("Tron wallet connect failed:", error);
        }
      },
      disconnect: async () => {
        try {
          await adapter.disconnect();
          setWalletStore({
            tronWalletAdapter: null
          });
          setAdapter(null);
        } catch (error) {
          console.error("Tron wallet disconnect failed:", error);
        }
      }
    };

    setWallets({
      tron: {
        account: adapter.address,
        wallet: walletRef.current,
        ...params,
        walletIcon: adapter.icon
      }
    });

    adapter.on("connect", (address: any) => {
      setWindowWallet(address);
      setWallets({
        tron: {
          account: address,
          wallet: walletRef.current,
          ...params,
          walletIcon: adapter.icon
        }
      });
    });

    adapter.on("disconnect", () => {
      setWallets({
        tron: {
          account: null,
          wallet: walletRef.current,
          ...params,
          walletIcon: null
        }
      });
      setWalletStore({
        tronWalletAdapter: null
      });
      setAdapter(null);
    });

    adapter.on("accountsChanged", (accounts: any) => {
      const newAccount = accounts
        ? Array.isArray(accounts)
          ? accounts[0]
          : accounts
        : null;

      setWindowWallet(newAccount);
      setWallets({
        tron: {
          account: newAccount,
          wallet: walletRef.current,
          ...params
        }
      });
    });
  }, [adapter]);

  return (
    <WalletSelector
      open={open}
      onClose={onClose}
      onConnect={onConnect}
      isConnecting={isConnecting}
      wallets={wallets}
      readyState={{ key: "_readyState", value: "Found" }}
      title="Select Tron Wallet"
    />
  );
};
