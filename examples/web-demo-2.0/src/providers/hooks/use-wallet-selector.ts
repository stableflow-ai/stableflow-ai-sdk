import { useState } from "react";

export function useWalletSelector(props: any) {
  const {
    connect,
  } = props;

  // Wallet selector
  const [open, setOpen] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const onConnect = async (wallet: any) => {
    try {
      setIsConnecting(wallet);
      await connect?.(wallet);
      onClose();
    } catch (error) {
      console.error(`Failed to connect to %o: %o`, wallet, error);
    } finally {
      setIsConnecting(null);
    }
  };
  const onClose = () => {
    setOpen(false);
  };
  const onOpen = () => {
    setOpen(true);
  };

  return {
    open,
    onClose,
    onOpen,
    onConnect,
    isConnecting,
  };
}
