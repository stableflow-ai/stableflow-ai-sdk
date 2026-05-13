export const FRAXZERO_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_fraxtalHop", "type": "bytes32" },
      { "internalType": "uint256", "name": "_numDVNs", "type": "uint256" },
      { "internalType": "address", "name": "_EXECUTOR", "type": "address" },
      { "internalType": "address", "name": "_DVN", "type": "address" },
      { "internalType": "address", "name": "_TREASURY", "type": "address" },
      { "internalType": "address[]", "name": "_approvedOfts", "type": "address[]" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "target", "type": "address" }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "AddressInsufficientBalance",
    "type": "error"
  },
  { "inputs": [], "name": "FailedInnerCall", "type": "error" },
  { "inputs": [], "name": "HopPaused", "type": "error" },
  { "inputs": [], "name": "InsufficientFee", "type": "error" },
  { "inputs": [], "name": "InvalidOFT", "type": "error" },
  {
    "inputs": [
      { "internalType": "uint16", "name": "optionType", "type": "uint16" }
    ],
    "name": "InvalidOptionType",
    "type": "error"
  },
  { "inputs": [], "name": "NotEndpoint", "type": "error" },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  { "inputs": [], "name": "RefundFailed", "type": "error" },
  {
    "inputs": [
      { "internalType": "uint8", "name": "bits", "type": "uint8" },
      { "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "SafeCastOverflowedUintDowncast",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  { "inputs": [], "name": "ZeroAmountSend", "type": "error" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "oft", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": true, "internalType": "uint32", "name": "dstEid", "type": "uint32" },
      { "indexed": true, "internalType": "bytes32", "name": "to", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "amountLD", "type": "uint256" }
    ],
    "name": "SendOFT",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DVN",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "EXECUTOR",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TREASURY",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "approvedOft",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint32", "name": "", "type": "uint32" }
    ],
    "name": "executorOptions",
    "outputs": [
      { "internalType": "bytes", "name": "", "type": "bytes" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fraxtalHop",
    "outputs": [
      { "internalType": "bytes32", "name": "", "type": "bytes32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hopFee",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "numDVNs",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bool", "name": "_paused", "type": "bool" }
    ],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_oft", "type": "address" },
      { "internalType": "uint32", "name": "_dstEid", "type": "uint32" },
      { "internalType": "bytes32", "name": "_to", "type": "bytes32" },
      { "internalType": "uint256", "name": "_amountLD", "type": "uint256" }
    ],
    "name": "quote",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
          { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
        ],
        "internalType": "struct MessagingFee",
        "name": "fee",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint32", "name": "_dstEid", "type": "uint32" }
    ],
    "name": "quoteHop",
    "outputs": [
      { "internalType": "uint256", "name": "finalFee", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "tokenAddress", "type": "address" },
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
    ],
    "name": "recoverERC20",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
    ],
    "name": "recoverETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_oft", "type": "address" },
      { "internalType": "uint32", "name": "_dstEid", "type": "uint32" },
      { "internalType": "bytes32", "name": "_to", "type": "bytes32" },
      { "internalType": "uint256", "name": "_amountLD", "type": "uint256" }
    ],
    "name": "sendOFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint32", "name": "eid", "type": "uint32" },
      { "internalType": "bytes", "name": "_options", "type": "bytes" }
    ],
    "name": "setExecutorOptions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_fraxtalHop", "type": "address" }
    ],
    "name": "setFraxtalHop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_fraxtalHop", "type": "bytes32" }
    ],
    "name": "setFraxtalHop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_hopFee", "type": "uint256" }
    ],
    "name": "setHopFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_numDVNs", "type": "uint256" }
    ],
    "name": "setNumDVNs",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_oft", "type": "address" },
      { "internalType": "bool", "name": "_approved", "type": "bool" }
    ],
    "name": "toggleOFTApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

export const FRAXZERO_REDEEM_MINT_ABI = [
  {
    "inputs": [],
    "name": "mdwrComboView",
    "outputs": [
      { "internalType": "uint256", "name": "maxAssetsDepositable", "type": "uint256" },
      { "internalType": "uint256", "name": "maxSharesMintable", "type": "uint256" },
      { "internalType": "uint256", "name": "maxAssetsWithdrawable", "type": "uint256" },
      { "internalType": "uint256", "name": "maxSharesRedeemable", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "sharesIn", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "redeem",
    "outputs": [
      { "internalType": "uint256", "name": "assetsOut", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "assetsIn", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "deposit",
    "outputs": [
      { "internalType": "uint256", "name": "sharesOut", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_assetsIn", "type": "uint256" }
    ],
    "name": "previewDeposit",
    "outputs": [
      { "internalType": "uint256", "name": "_sharesOut", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_assetsOut", "type": "uint256" }
    ],
    "name": "previewWithdraw",
    "outputs": [
      { "internalType": "uint256", "name": "_sharesIn", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_sharesOut", "type": "uint256" }
    ],
    "name": "previewMint",
    "outputs": [
      { "internalType": "uint256", "name": "_assetsIn", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_sharesIn", "type": "uint256" }
    ],
    "name": "previewRedeem",
    "outputs": [
      { "internalType": "uint256", "name": "_assetsOut", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "assetsIn", "type": "uint256" },
      { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
      { "internalType": "bytes32", "name": "receiver", "type": "bytes32" }
    ],
    "name": "mintAndSend",
    "outputs": [
      { "internalType": "bytes32", "name": "guidOrZero", "type": "bytes32" },
      { "internalType": "uint256", "name": "sharesOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "sharesIn", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "redeemToUsdcAndTransfer",
    "outputs": [
      { "internalType": "uint256", "name": "assetsOut", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxUstbRedemptionAmount",
    "outputs": [
      { "internalType": "uint256", "name": "superstateTokenAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "usdPerUstbChainlinkRaw", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "superstateTokenInAmount", "type": "uint256" }
    ],
    "name": "calculateUsdcOut",
    "outputs": [
      { "internalType": "uint256", "name": "usdcOutAmountAfterFee", "type": "uint256" },
      { "internalType": "uint256", "name": "usdPerUstbChainlinkRaw", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];
