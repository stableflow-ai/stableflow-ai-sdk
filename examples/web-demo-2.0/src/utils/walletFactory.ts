// Wallet factory to create wallet instances based on chain type
export interface WalletAdapter {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAddress: () => Promise<string | null>;
  isConnected: () => boolean;
  signTransaction?: (tx: any) => Promise<any>;
  signAndSendTransaction?: (tx: any) => Promise<string>;
}

export const createWalletAdapter = (
  chainType: string,
  walletInstance: any
): WalletAdapter | null => {
  switch (chainType) {
    case 'evm':
      return createEVMWallet(walletInstance);
    case 'sol':
      return createSolanaWallet(walletInstance);
    case 'near':
      return createNearWallet(walletInstance);
    case 'tron':
      return createTronWallet(walletInstance);
    case 'aptos':
      return createAptosWallet(walletInstance);
    default:
      return null;
  }
};

const createEVMWallet = (wallet: any): WalletAdapter => {
  return {
    connect: async () => {
      if (wallet?.connectors?.[0]) {
        await wallet.connect({ connector: wallet.connectors[0] });
      }
    },
    disconnect: async () => {
      await wallet.disconnect();
    },
    getAddress: async () => {
      return wallet.address || null;
    },
    isConnected: () => {
      return wallet.isConnected && wallet.address != null;
    },
  };
};

const createSolanaWallet = (wallet: any): WalletAdapter => {
  return {
    connect: async () => {
      if (wallet?.connect) {
        await wallet.connect();
      }
    },
    disconnect: async () => {
      if (wallet?.disconnect) {
        await wallet.disconnect();
      }
    },
    getAddress: async () => {
      return wallet.publicKey?.toString() || null;
    },
    isConnected: () => {
      return wallet.connected || false;
    },
    signTransaction: async (tx: any) => {
      if (wallet?.signTransaction) {
        return await wallet.signTransaction(tx);
      }
      throw new Error('Sign transaction not supported');
    },
    signAndSendTransaction: async (tx: any) => {
      if (wallet?.sendTransaction) {
        const signature = await wallet.sendTransaction(tx, wallet.connection);
        return signature;
      }
      throw new Error('Send transaction not supported');
    },
  };
};

const createNearWallet = (wallet: any): WalletAdapter => {
  return {
    connect: async () => {
      if (wallet?.connect) {
        await wallet.connect();
      }
    },
    disconnect: async () => {
      if (wallet?.disconnect) {
        await wallet.disconnect();
      }
    },
    getAddress: async () => {
      return wallet.accountId || null;
    },
    isConnected: () => {
      return wallet.isSignedIn || false;
    },
    signAndSendTransaction: async (tx: any) => {
      if (wallet?.signAndSendTransaction) {
        const result = await wallet.signAndSendTransaction(tx);
        return result.transaction.hash;
      }
      throw new Error('Send transaction not supported');
    },
  };
};

const createTronWallet = (wallet: any): WalletAdapter => {
  return {
    connect: async () => {
      if (wallet?.connect) {
        await wallet.connect();
      }
    },
    disconnect: async () => {
      if (wallet?.disconnect) {
        await wallet.disconnect();
      }
    },
    getAddress: async () => {
      return wallet.address || null;
    },
    isConnected: () => {
      return wallet.connected || false;
    },
    signAndSendTransaction: async (tx: any) => {
      if (wallet?.sendTransaction) {
        const result = await wallet.sendTransaction(tx);
        return result.txid;
      }
      throw new Error('Send transaction not supported');
    },
  };
};

const createAptosWallet = (wallet: any): WalletAdapter => {
  return {
    connect: async () => {
      if (wallet?.connect) {
        await wallet.connect();
      }
    },
    disconnect: async () => {
      if (wallet?.disconnect) {
        await wallet.disconnect();
      }
    },
    getAddress: async () => {
      return wallet.account?.address?.toString() || null;
    },
    isConnected: () => {
      return wallet.isConnected || false;
    },
    signAndSendTransaction: async (tx: any) => {
      if (wallet?.signAndSubmitTransaction) {
        const result = await wallet.signAndSubmitTransaction(tx);
        return result.hash;
      }
      throw new Error('Send transaction not supported');
    },
  };
};

