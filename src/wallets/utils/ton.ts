import { toBigIntBE, toBufferBE } from "bigint-buffer";
import { Address, beginCell, Cell } from "@ton/ton";
import { Csl } from "../../utils/log";
import { OpenAPI } from "../../core/OpenAPI";
import { baseBuildClass, buildClass, emptyCell, emptyMap, emptyPOOO, generateBuildClass, generateDecodeClass, nullObject } from "@layerzerolabs/lz-ton-sdk-v2";
// @ts-ignore --resolveJsonModule
import UlnArtifact from "@layerzerolabs/lz-ton-sdk-v2/artifacts/Uln.compiled.json";
// @ts-ignore --resolveJsonModule
import EndpointArtifact from "@layerzerolabs/lz-ton-sdk-v2/artifacts/Endpoint.compiled.json";
// @ts-ignore --resolveJsonModule
import UlnConnectionArtifact from "@layerzerolabs/lz-ton-sdk-v2/artifacts/UlnConnection.compiled.json";
// @ts-ignore --resolveJsonModule
import ChannelArtifact from "@layerzerolabs/lz-ton-sdk-v2/artifacts/Channel.compiled.json";

const TONCENTER_API = "https://toncenter.com/api/v3";

export interface PollTransactionByBocOptions {
  maxPollCount?: number;
  pollInterval?: number;
}

export interface PollTransactionByBocResult {
  hexHash: string;
  txHash: string;
  transaction: Record<string, unknown>;
}

/**
 * Poll TON transaction by boc, returns tx hash when confirmed on-chain
 * @param boc base64-encoded boc
 * @param options maxPollCount - max poll attempts, pollInterval - interval in ms
 * @returns hex hash and raw transaction data
 */
export async function pollTransactionByBoc(
  boc: string,
  options: PollTransactionByBocOptions = {}
): Promise<PollTransactionByBocResult> {
  const { maxPollCount = 60, pollInterval = 3000 } = options;

  const cs = new Csl(OpenAPI.DEBUG);
  const csl = cs.log;

  const bocCell = Cell.fromBoc(Buffer.from(boc, "base64"))[0];
  const messageHash = bocCell.hash().toString("hex");
  const url = `${TONCENTER_API}/transactionsByMessage?msg_hash=${messageHash}&direction=in&limit=1`;

  for (let i = 0; i < maxPollCount; i++) {
    csl("TON pollTransactionByBoc", "rose-600", "polling transaction status (%s), %d times", messageHash, i + 1);
    const response = await fetch(url);
    const data = (await response.json()) as { transactions?: Array<{ hash: string }> };
    csl("TON pollTransactionByBoc", "rose-600", "polling transaction response: %o", data);

    if (data.transactions && data.transactions.length > 0) {
      const txHash = data.transactions[0].hash;
      const hexHash = Buffer.from(txHash, "base64").toString("hex");
      return {
        hexHash,
        txHash,
        transaction: data.transactions[0] as Record<string, unknown>,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    "Query timeout, transaction hash not found. Please check if the wallet transaction was successful."
  );
}

export const buildJettonWalletTransferBody = (params: {
  memo?: string;
  amount: string;
  recipient: string;
  refundTo: string;
  forwardTonAmount?: bigint;
  forwardPayload?: Cell;
}) => {
  const {
    memo,
    amount,
    recipient,
    refundTo,
    forwardTonAmount,
    forwardPayload,
  } = params;

  let _forwardPayload = forwardPayload;
  if (!_forwardPayload) {
    _forwardPayload = beginCell().endCell(); // empty payload reference
    if (memo) {
      _forwardPayload = beginCell()
        .storeUint(0, 32) // op code for comment
        .storeStringTail(memo) // memo text
        .endCell();
    }
  }

  return beginCell()
    .storeUint(0x0f8a7ea5, 32) // Jetton transfer op code
    .storeUint(0, 64) // query_id
    .storeCoins(BigInt(amount)) // Jetton amount (VarUInteger 16)
    .storeAddress(Address.parse(recipient)) // destination
    .storeAddress(Address.parse(refundTo)) // response_destination
    .storeBit(0) // custom_payload:(Maybe ^Cell)
    .storeCoins(forwardTonAmount ?? 0n) // forward_ton_amount (VarUInteger 16) - if >0, will send notification message
    .storeBit(1) // forward_payload:(Either Cell ^Cell) - as a reference
    .storeRef(_forwardPayload)
    .endCell();
};

export const tonObjects = {
  OFTSend: {
    name: 'OFTSend',
    0: {
      fieldName: 'OFTSend::dstEid',
      fieldType: 'cl::t::uint32',
    },
    1: {
      fieldName: 'OFTSend::to',
      fieldType: 'cl::t::address',
    },
    2: {
      fieldName: 'OFTSend::minAmount',
      fieldType: 'cl::t::coins',
    },
    3: {
      fieldName: 'OFTSend::nativeFee',
      fieldType: 'cl::t::coins',
    },
    4: {
      fieldName: 'OFTSend::zroFee',
      fieldType: 'cl::t::coins',
    },
    5: {
      fieldName: 'OFTSend::extraOptions',
      fieldType: 'cl::t::objRef',
    },
    6: {
      fieldName: 'OFTSend::composeMessage',
      fieldType: 'cl::t::cellRef',
    },
  },
  UsdtOFT: {
    name: 'usdtOFT',
    0: {
      fieldName: 'UsdtOFT::oAppStorage',
      fieldType: 'cl::t::objRef',
    },
    1: {
      fieldName: 'UsdtOFT::credits',
      fieldType: 'cl::t::objRef',
    },
    2: {
      fieldName: 'UsdtOFT::contractBalance',
      fieldType: 'cl::t::coins',
    },
    3: {
      fieldName: 'UsdtOFT::feeBalance',
      fieldType: 'cl::t::coins',
    },
    4: {
      fieldName: 'UsdtOFT::feeBps',
      fieldType: 'cl::t::uint16',
    },
    5: {
      fieldName: 'UsdtOFT::contractWalletAddress',
      fieldType: 'cl::t::address',
    },
    6: {
      fieldName: 'UsdtOFT::plannerAddress',
      fieldType: 'cl::t::address',
    },
    7: {
      fieldName: 'UsdtOFT::gasAsserts',
      fieldType: 'cl::t::objRef',
    },
    8: {
      fieldName: 'UsdtOFT::costAsserts',
      fieldType: 'cl::t::objRef',
    },
    9: {
      fieldName: 'UsdtOFT::recoverRequest',
      fieldType: 'cl::t::objRef',
    },
    10: {
      fieldName: 'UsdtOFT::lpAdminAddress',
      fieldType: 'cl::t::address',
    },
    11: {
      fieldName: 'UsdtOFT::maxComposeMessageBytes',
      fieldType: 'cl::t::uint32',
    },
  },
  GasAsserts: {
    name: 'GasAssert',
    0: {
      fieldName: 'GasAsserts::sendOFTGas',
      fieldType: 'cl::t::uint32',
    },
    1: {
      fieldName: 'GasAsserts::sendOFTGasReceiveGas',
      fieldType: 'cl::t::uint32',
    },
    2: {
      fieldName: 'GasAsserts::sendCreditsGas',
      fieldType: 'cl::t::uint32',
    },
    3: {
      fieldName: 'GasAsserts::sendCreditsGasReceiveGas',
      fieldType: 'cl::t::uint32',
    },
    4: {
      fieldName: 'GasAsserts::lzReceiveExecuteCallbackGas',
      fieldType: 'cl::t::uint32',
    },
    5: {
      fieldName: 'GasAsserts::sendOFTComposeGas',
      fieldType: 'cl::t::uint32',
    },
  },
} as const;

export const ulnConfigs: Record<string, any> = {
  Arbitrum: {
    "confirmations": "2",
    "confirmationsNull": false,
    "executor": "0x0",
    "executorNull": true,
    "maxMessageBytes": "522",
    "optionalDVNs": [],
    "optionalDVNsNull": false,
    "requiredDVNs": [
      "0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7",
      "0x4b9f9836004d7f53e52e01602d9c07c14cdf38b8a946b6e813cfea8de10927d"
    ],
    "requiredDVNsNull": false,
    "workerQuoteGasLimit": "120000"
  },
  Celo: {
    "confirmations": "2",
    "confirmationsNull": false,
    "executor": "0x0",
    "executorNull": true,
    "maxMessageBytes": "522",
    "optionalDVNs": [],
    "optionalDVNsNull": false,
    "requiredDVNs": [
      "0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7",
      "0x4b9f9836004d7f53e52e01602d9c07c14cdf38b8a946b6e813cfea8de10927d"
    ],
    "requiredDVNsNull": false,
    "workerQuoteGasLimit": "120000"
  },
  Ethereum: {
    "confirmations": "2",
    "confirmationsNull": false,
    "executor": "0x0",
    "executorNull": true,
    "maxMessageBytes": "522",
    "optionalDVNs": [],
    "optionalDVNsNull": false,
    "requiredDVNs": [
      "0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7",
      "0x4b9f9836004d7f53e52e01602d9c07c14cdf38b8a946b6e813cfea8de10927d"
    ],
    "requiredDVNsNull": false,
    "workerQuoteGasLimit": "120000"
  },
  Solana: {
    "confirmations": "2",
    "confirmationsNull": false,
    "executor": "0xf9a60ea29c5c9e4643601e8881e850498ee680a413e8ba01d5e55ce1c221024",
    "executorNull": false,
    "maxMessageBytes": "1024",
    "optionalDVNs": [],
    "optionalDVNsNull": true,
    "requiredDVNs": [
      "0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7",
      "0x4b9f9836004d7f53e52e01602d9c07c14cdf38b8a946b6e813cfea8de10927d"
    ],
    "requiredDVNsNull": false,
    "workerQuoteGasLimit": "0"
  },
  Tron: {
    "confirmations": "2",
    "confirmationsNull": false,
    "executor": "0x0",
    "executorNull": true,
    "maxMessageBytes": "522",
    "optionalDVNs": [],
    "optionalDVNsNull": false,
    "requiredDVNs": [
      "0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7",
      "0x4b9f9836004d7f53e52e01602d9c07c14cdf38b8a946b6e813cfea8de10927d"
    ],
    "requiredDVNsNull": false,
    "workerQuoteGasLimit": "120000"
  },
} as const;

// ─── Address Utilities ─────────────────────────────────────

function to32ByteBuffer(value: bigint | number | string | Uint8Array): Buffer {
  if (typeof value === "string") {
    if (!/^(0x)?[0-9A-Fa-f]*$/.test(value)) {
      throw new Error("only hex string is supported");
    }
    let hex = value.replace(/^0x/, "");
    if (hex.length % 2 !== 0) {
      hex = "0" + hex;
    }
    value = toBigIntBE(Buffer.from(hex, "hex"));
  }
  if (value instanceof Uint8Array) {
    value = toBigIntBE(Buffer.from(value));
  }
  const bf = toBufferBE(BigInt(value), 66);
  return bf.subarray(-32);
}

function bigintToAddress(value: bigint): Address {
  const buf = to32ByteBuffer(value);
  return Address.parse(`0:${buf.toString("hex")}`);
}

type AddressTypeLike = Address | string | bigint;

export function parseTonAddress(address: AddressTypeLike): Address {
  if (address instanceof Address) return address;
  if (typeof address === "bigint" || typeof address === "number") {
    return bigintToAddress(BigInt(address));
  }
  if (address.startsWith("0x")) {
    return bigintToAddress(BigInt(address));
  }
  try {
    return Address.parse(address);
  } catch {
    return bigintToAddress(BigInt(`0x${address}`));
  }
}

export function addressToBigInt(address: AddressTypeLike): bigint {
  return BigInt(`0x${parseTonAddress(address).hash.toString("hex")}`);
}

export function bigIntToAddress(address: bigint): Address {
  return parseTonAddress("0x" + address.toString(16));
}

// ─── Cell Builders ─────────────────────────────────────────

export function objectBuild(tonObjects: Record<string, any>) {
  const generated = generateBuildClass(tonObjects);
  return Object.fromEntries(
    Object.keys(tonObjects).map((key) => [
      key,
      (fields: any) => generated(key, fields),
    ])
  ) as Record<string, (fields: any) => Cell>;
}

export function objectDecode(tonObjects: Record<string, any>) {
  const generated = generateDecodeClass(tonObjects);
  return Object.fromEntries(
    Object.keys(tonObjects).map((key) => [
      key,
      (cell: Cell) => generated(key, cell),
    ])
  ) as Record<string, (cell: Cell) => any>;
}

export function buildTonTransferCell(opts: {
  value: bigint;
  fromAddress?: Address;
  toAddress: Address;
  queryId?: number;
  fwdAmount: bigint;
  jettonAmount: bigint;
  forwardPayload?: Cell | null;
}): Cell {
  const builder = beginCell()
    .storeUint(0xf8a7ea5, 32) // Jetton Transfer opcode
    .storeUint(opts.queryId ?? 69, 64)
    .storeCoins(opts.jettonAmount)
    .storeAddress(opts.toAddress)
    .storeAddress(opts.fromAddress)
    .storeUint(0, 1)
    .storeCoins(opts.fwdAmount);

  if (opts.forwardPayload instanceof Cell) {
    builder.storeBit(1);
    builder.storeRef(opts.forwardPayload);
  } else {
    builder.storeBit(0);
  }

  return builder.endCell();
}

// ─── Contract Address Computation (USDT only) ──────────────

const TON_EID = 30343;

const contractCode = {
  uln: Cell.fromBoc(Buffer.from(UlnArtifact.hex, "hex"))[0],
  endpoint: Cell.fromBoc(Buffer.from(EndpointArtifact.hex, "hex"))[0],
  ulnConnection: Cell.fromBoc(
    Buffer.from(UlnConnectionArtifact.hex, "hex")
  )[0],
  channel: Cell.fromBoc(Buffer.from(ChannelArtifact.hex, "hex"))[0],
};

function computeContractAddress(code: Cell, storage: Cell): bigint {
  return toBigIntBE(
    beginCell()
      .storeUint(6, 5)
      .storeRef(code)
      .storeRef(storage)
      .endCell()
      .hash()
  );
}

function initBaseStorage(owner: bigint) {
  return baseBuildClass("BaseStorage", {
    owner,
    authenticated: false,
    initialized: false,
    initialStorage: emptyCell(),
  });
}

function getUlnReceiveConfigDefault() {
  return buildClass("UlnReceiveConfig", {
    minCommitPacketGasNull: true,
    minCommitPacketGas: 0,
    confirmationsNull: true,
    confirmations: 0,
    requiredDVNsNull: true,
    requiredDVNs: emptyCell(),
    optionalDVNsNull: true,
    optionalDVNs: emptyCell(),
    optionalDVNThreshold: 0,
  });
}

function getUlnSendConfigDefault() {
  return buildClass("UlnSendConfig", {
    workerQuoteGasLimit: 0,
    maxMessageBytes: 0,
    executorNull: true,
    executor: 0n,
    requiredDVNsNull: true,
    requiredDVNs: emptyCell(),
    optionalDVNsNull: true,
    optionalDVNs: emptyCell(),
    confirmationsNull: true,
    confirmations: 0,
  });
}

export function computeTonUlnAddress(
  _kind: "USDT",
  owner: bigint,
  dstEid: bigint
): bigint {
  return computeContractAddress(
    contractCode.uln,
    buildClass("Uln", {
      baseStorage: initBaseStorage(owner),
      eid: TON_EID,
      dstEid,
      defaultUlnReceiveConfig: getUlnReceiveConfigDefault(),
      defaultUlnSendConfig: getUlnSendConfigDefault(),
      connectionCode: emptyCell(),
      workerFeelibInfos: emptyMap(),
      treasuryFeeBps: 0,
      remainingWorkerSlots: 0,
      remainingAdminWorkerSlots: 0,
    })
  );
}

export function computeTonEndpointAddress(
  _kind: "USDT",
  owner: bigint,
  dstEid: bigint
): bigint {
  return computeContractAddress(
    contractCode.endpoint,
    buildClass("Endpoint", {
      baseStorage: initBaseStorage(owner),
      eid: TON_EID,
      dstEid,
      msglibs: emptyMap(),
      numMsglibs: 0,
      channelCode: emptyCell(),
      channelStorageInit: nullObject(),
      defaultSendLibInfo: nullObject(),
      defaultReceiveLibInfo: nullObject(),
      defaultTimeoutReceiveLibInfo: nullObject(),
      defaultSendMsglibManager: 0n,
      defaultExpiry: 0,
    })
  );
}

export function computeTonUlnConnectionAddress(
  _kind: "USDT",
  owner: bigint,
  dstEid: bigint,
  dstOApp: bigint,
  ulnManagerAddress: bigint,
  ulnAddress: bigint
): bigint {
  return computeContractAddress(
    contractCode.ulnConnection,
    buildUlnConnnection(owner, dstEid, dstOApp, ulnManagerAddress, ulnAddress)
  );
}

export function buildUlnConnnection(
  owner: bigint,
  dstEid: bigint,
  dstOApp: bigint,
  ulnManagerAddress: bigint,
  ulnAddress: bigint
) {
  return buildClass("UlnConnection", {
    baseStorage: initBaseStorage(ulnManagerAddress),
    path: {
      srcEid: TON_EID,
      dstEid,
      srcOApp: owner,
      dstOApp,
    },
    endpointAddress: 0n,
    channelAddress: 0n,
    ulnAddress,
    UlnSendConfigOApp: getUlnSendConfigDefault(),
    UlnReceiveConfigOApp: getUlnReceiveConfigDefault(),
    hashLookups: emptyMap(),
    firstUnexecutedNonce: 1,
    commitPOOO: emptyCell(),
  });
}

export function computeTonChannelAddress(
  _kind: "USDT",
  owner: bigint,
  dstEid: bigint,
  dstOApp: bigint,
  controllerAddress: bigint,
  endpointAddress: bigint
): bigint {
  return computeContractAddress(
    contractCode.channel,
    buildClass("Channel", {
      baseStorage: initBaseStorage(controllerAddress),
      path: {
        srcEid: TON_EID,
        dstEid,
        srcOApp: owner,
        dstOApp,
      },
      endpointAddress,
      epConfigOApp: {
        isNull: true,
        sendMsglib: 0n,
        sendMsglibConnection: 0n,
        sendMsglibManager: 0n,
        receiveMsglib: 0n,
        receiveMsglibConnection: 0n,
        timeoutReceiveMsglib: 0n,
        timeoutReceiveMsglibConnection: 0n,
        timeoutReceiveMsglibExpiry: 0,
      },
      outboundNonce: 0,
      sendRequestQueue: emptyCell(),
      lastSendRequestId: 0,
      commitPOOO: emptyPOOO(),
      executePOOO: emptyPOOO(),
      executionQueue: emptyCell(),
      zroBalance: 0,
    })
  );
}
