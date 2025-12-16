import { create } from "zustand/index";

interface WalletsState {
  near: {
    account: string | null;
    wallet: any;
    connect: () => void;
    disconnect: () => void;
    walletIcon: string | null;
  };
  sol: {
    account: string | null;
    wallet: any;
    connect: () => void;
    disconnect: () => void;
    walletIcon: string | null;
  };
  evm: {
    account: string | null;
    wallet: any;
    chainId: number | null;
    connect: () => void;
    disconnect: () => void;
    walletIcon: string | null;
  };
  tron: {
    account: string | null;
    wallet: any;
    connect: () => void;
    disconnect: () => void;
    walletIcon: string | null;
  };
  aptos: {
    account: string | null;
    wallet: any;
    connect: () => void;
    disconnect: () => void;
    walletIcon: string | null;
  };
  set: (params: any) => void;
}

const useWalletsStore = create<WalletsState>((set) => ({
  near: {
    account: null,
    wallet: null,
    connect: () => { },
    disconnect: () => { },
    walletIcon: null
  },
  sol: {
    account: null,
    wallet: null,
    connect: () => { },
    disconnect: () => { },
    walletIcon: null
  },
  evm: {
    account: null,
    wallet: null,
    chainId: null,
    connect: () => { },
    disconnect: () => { },
    walletIcon: null
  },
  tron: {
    account: null,
    wallet: null,
    connect: () => { },
    disconnect: () => { },
    walletIcon: null
  },
  aptos: {
    account: null,
    wallet: null,
    connect: () => { },
    disconnect: () => { },
    walletIcon: null
  },
  set: (params) => set(() => ({ ...params }))
}));

export default useWalletsStore;
