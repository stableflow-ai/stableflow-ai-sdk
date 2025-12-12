import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { TokenConfig } from 'stableflow-ai-sdk';

interface WalletConnectorProps {
  chain: TokenConfig;
  onAddressChange?: (address?: string | null) => void;
  children?: React.ReactNode;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  chain,
  onAddressChange,
  children,
}) => {
  const { address, isConnected, connect, disconnect } = useWallet(chain);
  const [connecting, setConnecting] = useState(false);

  React.useEffect(() => {
    if (onAddressChange) {
      onAddressChange(address);
    }
  }, [address, onAddressChange]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  };

  return (
    <div className="wallet-connector">
      {isConnected && address ? (
        <div className="wallet-connected">
          <span className="wallet-address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button onClick={handleDisconnect} className="btn-disconnect">
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="btn-connect"
        >
          {connecting ? 'Connecting...' : `Connect ${chain.chainName} Wallet`}
        </button>
      )}
      {children}
    </div>
  );
};

