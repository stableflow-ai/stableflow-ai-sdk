import React, { useEffect } from "react";
import {
  setupWalletSelector,
} from "@near-wallet-selector/core";
import {
  setupModal,
} from "@near-wallet-selector/modal-ui";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import useWalletsStore from "../stores/use-wallets";
import { NearWallet } from 'stableflow-ai-sdk';

import "@near-wallet-selector/modal-ui/styles.css";

export default function NEARProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const nearNetwork = {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://app.mynearwallet.com/",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://nearblocks.io"
  };
  const walletsStore = useWalletsStore();
  useEffect(() => {
    const init = async () => {
      try {
        const _selector = await setupWalletSelector({
          network: nearNetwork.networkId as "testnet" | "mainnet",
          debug: false,
          modules: [
            setupMeteorWallet(),
          ]
        });

        const _modal = setupModal(_selector, {
          contractId: ""
        });

        const state = _selector.store.getState();

        const params = {
          wallet: new NearWallet(_selector),

          connect: () => {
            _modal.show();
          },
          disconnect: async () => {
            const wallet = await _selector.wallet();
            await wallet.signOut();
            walletsStore.set({
              near: {
                account: null,
                wallet: null
              }
            });
          }
        };

        walletsStore.set({
          near: {
            ...params,
            account:
              state.accounts.find((account) => account.active)?.accountId ||
              null
          }
        });

        _selector.store.observable.subscribe(async (state) => {
          try {
            const wallet = await _selector.wallet();
            walletsStore.set({
              near: {
                ...params,
                walletIcon: wallet?.metadata.iconUrl,
                account:
                  state.accounts.find((account) => account.active)?.accountId ||
                  null
              }
            });
          } catch (error) {
          }
        });
      } catch (error) {
        console.error("init near wallet selector failed:", error);
      }
    };

    init();
  }, [nearNetwork.networkId, walletsStore?.near?.account]);

  return children;
}
