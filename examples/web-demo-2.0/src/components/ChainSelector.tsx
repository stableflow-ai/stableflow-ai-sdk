import React from 'react';

import { tokens } from 'stableflow-ai-sdk';

interface ChainSelectorProps {
  label: string;
  value?: string;
  onChange: (chainKey: string) => void;
  excludeContractAddress?: string;
  disabled?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  label,
  value,
  onChange,
  excludeContractAddress,
  disabled,
}) => {
  const tokenList = tokens.filter(
    (token) => token.contractAddress !== excludeContractAddress
  );

  return (
    <div className="chain-selector">
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="select-chain"
      >
        <option value="">Select chain</option>
        {tokenList.map((token) => (
          <option key={token.contractAddress} value={token.contractAddress}>
            {token.symbol} - {token.chainName}
          </option>
        ))}
      </select>
    </div>
  );
};

