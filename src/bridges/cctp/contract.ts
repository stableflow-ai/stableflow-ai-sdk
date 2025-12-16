
// https://developers.circle.com/cctp/evm-smart-contracts#tokenmessengerv2-mainnet
export const CCTP_TOKEN_MESSENGER: Record<string, string> = {
  ["Ethereum"]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  ["Arbitrum"]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  ["Polygon"]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  ["Optimism"]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  ["Avalanche"]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  ["Solana"]: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
};

export const CCTP_TOKEN_PROXY: Record<string, string> = {
  ["Ethereum"]: "0x54Cf68aB8f68813F2a2dF20Af72D19c44485a0b2",
  ["Arbitrum"]: "0x54Cf68aB8f68813F2a2dF20Af72D19c44485a0b2",
  ["Polygon"]: "0x7A18854b695BA7efB7229c17D0E1Cd2679481D28",
  ["Optimism"]: "0x54Cf68aB8f68813F2a2dF20Af72D19c44485a0b2",
  ["Avalanche"]: "0xB6E3a1165aC3E0c370e316C27E959482460dBeDD",
  ["Solana"]: "8whUZNSbjJXC2UDRpo3PXo5MHzhptwVTTwpSYuTgQJNY",
  ["Base"]: "0x7092B8E5445Fca836B0f9780c77C38C7cbb9A43D",
};

export const CCTP_TOKEN_MESSENGER_ABI = [
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "hookData", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "finalityThreshold", type: "uint32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
];

export const CCTP_TOKEN_PROXY_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "originalAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "chargedAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "destinationDomain",
        "type": "uint32"
      },
      {
        "internalType": "bytes32",
        "name": "mintRecipient",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "burnToken",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "destinationCaller",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "maxFee",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "minFinalityThreshold",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "depositWithFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userNonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
