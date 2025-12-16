import { create } from "zustand/index";
import { createJSONStorage, persist } from "zustand/middleware";

interface WalletState {
  showWallet: boolean;
  usdtExpand: boolean;
  selectedToken: "USDT" | "USDC";
  fromToken: any;
  toToken: any;
  isTo: boolean;
  tronWalletAdapter: string | null;
  set: (params: any) => void;
}

const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      showWallet: false,
      usdtExpand: false,
      selectedToken: "USDT",
      fromToken: null,
      toToken: null,
      isTo: false,
      tronWalletAdapter: null,
      set: (params) => set(() => ({ ...params }))
    }),
    {
      name: "_sfa_wallet",
      version: 0.1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        usdtExpand: state.usdtExpand,
        selectedToken: state.selectedToken
      })
    }
  )
);

export default useWalletStore;
