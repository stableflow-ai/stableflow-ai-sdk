import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { struct, u32, u64, bytes, option, bool } from '@metaplex-foundation/umi/serializers';
import { ethers } from 'ethers';

const SEEDS = {
  OFT: Buffer.from('OFT'),
  PEER: Buffer.from('Peer'),
  CREDITS: Buffer.from('Credits'),
  EVENT_AUTHORITY: Buffer.from('__event_authority'),
};

const DISCRIMINATOR = {
  quoteSend: new Uint8Array([207, 0, 49, 214, 160, 211, 76, 211]),
  send: new Uint8Array([102, 251, 20, 187, 65, 75, 12, 69]),
};

function u32be(n: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(n, 0);
  return buf;
}

export function deriveOftPdas(programId: PublicKey, dstEid: number) {
  return {
    oftStore: PublicKey.findProgramAddressSync([SEEDS.OFT], programId)[0],
    peer: PublicKey.findProgramAddressSync([SEEDS.PEER, u32be(dstEid)], programId)[0],
    credits: PublicKey.findProgramAddressSync([SEEDS.CREDITS], programId)[0],
    eventAuthority: PublicKey.findProgramAddressSync([SEEDS.EVENT_AUTHORITY], programId)[0],
  };
}

export async function getPeerAddress(
  connection: Connection,
  programId: PublicKey,
  dstEid: number,
): Promise<`0x${string}`> {
  const { peer } = deriveOftPdas(programId, dstEid);
  const info = await connection.getAccountInfo(peer);
  if (!info) throw new Error(`Peer not found for EID ${dstEid}`);
  // Layout: discriminator(8) + peerAddress(32)
  return `0x${info.data.subarray(8, 40).toString('hex')}`;
}

type QuoteSendParams = {
  dstEid: number;
  to: Uint8Array;
  amountLd: bigint;
  minAmountLd: bigint;
  extraOptions: Uint8Array;
  composeMsg: Uint8Array | null;
  payInLzToken: boolean;
};

const quoteSendParamsSerializer = struct([
  ['dstEid', u32()],
  ['to', bytes({ size: 32 })],
  ['amountLd', u64()],
  ['minAmountLd', u64()],
  ['extraOptions', bytes({ size: u32() })],
  ['composeMsg', option(bytes({ size: u32() }))],
  ['payInLzToken', bool()],
]);

export function encodeQuoteSend(params: QuoteSendParams): Uint8Array {
  const paramsData = quoteSendParamsSerializer.serialize(params);
  const data = new Uint8Array(8 + paramsData.length);
  data.set(DISCRIMINATOR.quoteSend, 0);
  data.set(paramsData, 8);
  return data;
}

type SendParams = {
  dstEid: number;
  to: Uint8Array;
  amountLd: bigint;
  minAmountLd: bigint;
  extraOptions: Uint8Array;
  composeMsg: Uint8Array | null;
  nativeFee: bigint;
  lzTokenFee: bigint;
};

const sendParamsSerializer = struct([
  ['dstEid', u32()],
  ['to', bytes({ size: 32 })],
  ['amountLd', u64()],
  ['minAmountLd', u64()],
  ['extraOptions', bytes({ size: u32() })],
  ['composeMsg', option(bytes({ size: u32() }))],
  ['nativeFee', u64()],
  ['lzTokenFee', u64()],
]);

export function encodeSend(params: SendParams): Uint8Array {
  const paramsData = sendParamsSerializer.serialize(params);
  const data = new Uint8Array(8 + paramsData.length);
  data.set(DISCRIMINATOR.send, 0);
  data.set(paramsData, 8);
  return data;
}

export function parseDecimalToUnits(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.split('.');
  const fracPadded = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + fracPadded);
}

//#region for Layerzero retry compose
export function normalizeHex(hex: string) {
  if (!hex) return "0x";
  const s = String(hex);

  const indices = [];
  const re = /0x/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    indices.push(m.index);
  }

  let best = "";
  if (indices.length === 0) {
    best = s.replace(/[^0-9a-fA-F]/g, "");
  } else {
    for (let i = 0; i < indices.length; i++) {
      const start = indices[i] + 2;
      const end = i + 1 < indices.length ? indices[i + 1] : s.length;
      const candidate = s.slice(start, end).replace(/[^0-9a-fA-F]/g, "");
      if (candidate.length > best.length) best = candidate;
    }
  }

  if (!best) return "0x";
  if (best.length % 2) throw new Error("hex length must be even");
  return "0x" + best.toLowerCase();
}

export function toBytes32(addrOrBytes32: string) {
  const h = normalizeHex(addrOrBytes32);
  if (h.length === 42) return ethers.zeroPadValue(h, 32); // address -> bytes32
  if (h.length === 66) return h;
  throw new Error("expected address(20B) or bytes32(32B)");
}

export function encodeUint(value: string, sizeBytes: number) {
  const bn = BigInt(value);
  const max = (1n << BigInt(sizeBytes * 8)) - 1n;

  if (bn < 0n || bn > max) {
    throw new Error(`value does not fit uint${sizeBytes * 8}`);
  }

  return ethers.zeroPadValue(ethers.toBeHex(bn), sizeBytes);
}

export function buildEndpointV2LzComposePayload(params: { nonce: string; srcEid: string; amountLD: string; composeFrom: string; composeMsg: string; }) {
  const { nonce, srcEid, amountLD, composeFrom, composeMsg } = params;
  return ethers.concat([
    encodeUint(nonce, 8),     // uint64
    encodeUint(srcEid, 4),    // uint32
    encodeUint(amountLD, 32), // uint256
    toBytes32(composeFrom),   // bytes32
    normalizeHex(composeMsg), // bytes
  ]);
}
//#endregion

// add buffer for native msg fee
export const NATIVE_MSG_FEE_BUFFER: bigint = 105n;
