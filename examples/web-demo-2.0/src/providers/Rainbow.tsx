import React, { useEffect, useState } from "react";
import {
  mainnet,
  polygon,
  arbitrum,
  bsc,
  base,
  avalanche,
  optimism,
  gnosis,
  berachain
} from "wagmi/chains";
import {
  WagmiProvider,
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
  cookieToInitialState,
  http,
  createConfig,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  connectorsForWallets,
  getDefaultConfig,
  useConnectModal
} from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { EVMWallet } from 'stableflow-ai-sdk';
import "@rainbow-me/rainbowkit/styles.css";
import useWalletsStore from "@/stores/use-wallets";
import { useDebounceFn } from "../hooks/useDebounceFn";
import { getRpcUrls } from "stableflow-ai-sdk";
import { createClient, fallback } from "viem";
import { metaMaskWallet, coinbaseWallet, okxWallet, bitgetWallet, binanceWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string;
export const metadata = {
  name: "StableFlow.ai",
  description: "Stablecoins to any chain, with one click.",
  // origin must match your domain & subdomain
  url: "https://app.stableflow.ai",
  icons: ["/logo.svg"]
};

const RpcUrls: any = {
  [mainnet.id]: fallback([...getRpcUrls("eth").map((rpc) => http(rpc)), http()]),
  [polygon.id]: fallback([...getRpcUrls("pol").map((rpc) => http(rpc)), http()]),
  [arbitrum.id]: fallback([...getRpcUrls("arb").map((rpc) => http(rpc)), http()]),
  [optimism.id]: fallback([...getRpcUrls("op").map((rpc) => http(rpc)), http()]),
  [bsc.id]: fallback([...getRpcUrls("bsc").map((rpc) => http(rpc)), http()]),
  [base.id]: fallback([...getRpcUrls("base").map((rpc) => http(rpc)), http()]),
  [avalanche.id]: fallback([...getRpcUrls("avax").map((rpc) => http(rpc)), http()]),
  [gnosis.id]: fallback([...getRpcUrls("gnosis").map((rpc) => http(rpc)), http()]),
  [berachain.id]: fallback([...getRpcUrls("bera").map((rpc) => http(rpc)), http()]),
};

const config = getDefaultConfig({
  appName: metadata.name,
  appDescription: metadata.description,
  appUrl: metadata.url,
  appIcon: metadata.icons[0],
  projectId,
  chains: [mainnet, polygon, arbitrum, bsc, base, avalanche, optimism, gnosis, berachain],
  transports: {
    [mainnet.id]: RpcUrls[mainnet.id] || http(),
    [polygon.id]: RpcUrls[polygon.id] || http(),
    [arbitrum.id]: RpcUrls[arbitrum.id] || http(),
    [bsc.id]: RpcUrls[bsc.id] || http(),
    [base.id]: RpcUrls[base.id] || http(),
    [avalanche.id]: RpcUrls[avalanche.id] || http(),
    [optimism.id]: RpcUrls[optimism.id] || http(),
    [gnosis.id]: RpcUrls[gnosis.id] || http(),
    [berachain.id]: RpcUrls[berachain.id] || http(),
  },
});
const connectors: any = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        okxWallet,
        metaMaskWallet,
        coinbaseWallet,
        bitgetWallet,
        binanceWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: metadata.name,
    projectId,
  }
);
const wagmiConfig = createConfig({
  ...config,
  connectors,
  client: ({ chain }) => {
    if (RpcUrls[chain.id]) {
      return createClient({
        chain,
        transport: RpcUrls[chain.id],
      })
    }
    return createClient({
      chain,
      transport: http()
    })
  }
});

const queryClient = new QueryClient();

export default function RainbowProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const initialState = cookieToInitialState(wagmiConfig);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" locale="en-US">
          {children}
          <Content />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Content() {
  const { disconnect } = useDisconnect();
  const account = useAccount();
  const { openConnectModal } = useConnectModal();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [mounted, setMounted] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);

  const { run: debouncedDisconnect } = useDebounceFn(
    async () => {
      if (!publicClient || !mounted) return;
      const provider = new ethers.BrowserProvider(publicClient);

      const signer = walletClient
        ? await new ethers.BrowserProvider(walletClient).getSigner()
        : null;

      const wallet = new EVMWallet(provider, signer);

      setWallets({
        evm: {
          account: account.address || null,
          chainId: account.chainId,
          wallet: wallet,
          connect: () => {
            openConnectModal?.();
          },
          disconnect: () => {
            disconnect?.();
            setWallets({
              evm: {
                account: null,
                wallet: null
              }
            });
          }
        }
      });
    },
    {
      wait: 500
    }
  );

  useEffect(() => {
    debouncedDisconnect();
  }, [account, publicClient, walletClient]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return null;
}
