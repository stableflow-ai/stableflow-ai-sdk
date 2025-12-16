export const ONECLICK_PROXY: Record<string, string> = {
  ["Arbitrum"]: "0xc8dB1175132C64e311D01258dD05D4e2e75fD7b8",
  ["Polygon"]: "0xc8dB1175132C64e311D01258dD05D4e2e75fD7b8",
  ["BNB Chain"]: "0xf5f1ec09b3ec88F6Cf23ADEEDd792E4642c5B7f1",
  ["Optimism"]: "0xc8dB1175132C64e311D01258dD05D4e2e75fD7b8",
  ["Avalanche"]: "0xc8dB1175132C64e311D01258dD05D4e2e75fD7b8",
  ["Ethereum"]: "0xc8dB1175132C64e311D01258dD05D4e2e75fD7b8",
  ["Berachain"]: "0x1766A6B8453c7dbcA8c70d17980B6EA87ACA4F60",
  ["Tron"]: "TMqM35eVd3D9d7JbShRrMzMPyWLFweKYvW",
  ["Solana"]: "HWk6MsFEGzXxpe9B4mfEHpvVoCwNeVVMFxb5Mi7qNTM",
  ["Near"]: "stbflow.near",
  ["Aptos"]: "0x3000ceb3211d23ef73ad1b602a7a99b72020c9ce9537f580ac5bba556ec3bff9",
  ["Base"]: "0x7A18854b695BA7efB7229c17D0E1Cd2679481D28",
};

export const ONECLICK_PROXY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "proxyTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];
