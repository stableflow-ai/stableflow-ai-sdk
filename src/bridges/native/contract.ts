// native chain name
export const NativeChains: Record<string, string> = {
  "Ethereum": "ethereum",
  "Arbitrum": "arbitrum",
  "BNB Chain": "bsc",
  "Base": "base",
};

export const NativeV4Routes: Record<string, { swap: string; bridge: string; }> = {
  "Ethereum": {
    swap: "0x8a2ddc0461Fcf96F81a05529Bed540d4f1eb2a00",
    bridge: "0xceBFC5dFBD5CE21694fe2ACefa63aD6f828831d2",
  },
  "Arbitrum": {
    swap: "0x0FC85a171bD0b53BF0bBace74F04B66170Ae3eAb",
    bridge: "0x5E65CEa5473fC8977e4DfDe940B2A99a439181cA",
  },
  "BNB Chain": {
    swap: "0xF064b069Ed18Eb5c61159247C55C5af79B28a968",
    bridge: "0x5B933868f5e710070b146213ED2Cd71628E465C1",
  },
  "Base": {
    swap: "0xaEC634d949df14Be76dC317504C7b9a6a8A5f576",
    bridge: "0xA11f7CdE7402093FF4D24A91FD8cdcc8AA0c96A8",
  },
};
