import bs58 from "bs58";
import { zeroPadValue } from "ethers";

/**
 * Convert Tron address to bytes32 format (for LayerZero OFT)
 * @param {string} tronAddress - Tron address in Base58check format (starts with T)
 * @returns {string} Address in bytes32 format (starts with 0x, left-padded with zeros)
 */
export function tronAddressToBytes32(tronAddress: string) {
  try {
    // 1. Decode base58check format
    const decoded = bs58.decode(tronAddress);

    // 2. Remove the first byte (0x41 prefix) and the last 4 bytes (checksum)
    // Tron address structure: [0x41] + [20-byte address] + [4-byte checksum]
    const addressBytes = decoded.slice(1, 21);

    // 3. Validate length
    if (addressBytes.length !== 20) {
      throw new Error('Invalid Tron address length');
    }

    // 4. Left pad with 12 zero bytes to make it 32 bytes
    const paddedBytes = Buffer.concat([
      Buffer.alloc(12, 0), // 12 zero bytes
      addressBytes         // 20-byte address
    ]);

    // 5. Convert to hexadecimal string
    return '0x' + paddedBytes.toString('hex');
  } catch (error: any) {
    throw new Error(`Failed to convert Tron address: ${error.message}`);
  }
}

/**
 * SHA256 hash using Web Crypto API (browser compatible)
 * @param {Uint8Array} data - Data to hash
 * @returns {Promise<Uint8Array>} Hash result
 */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Create a new ArrayBuffer from the Uint8Array to ensure proper type
  const buffer = new Uint8Array(data).buffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
}

/**
 * Converts bytes32 to Tron address
 * @param {string} bytes32Address - Address in bytes32 format
 * @returns {Promise<string>} Tron address in Base58check format
 */
export async function bytes32ToTronAddress(bytes32Address: string): Promise<string> {
  try {
    // Remove '0x' prefix
    const hexString = bytes32Address.startsWith('0x')
      ? bytes32Address.slice(2)
      : bytes32Address;

    // Convert to Buffer
    const buffer = Buffer.from(hexString, 'hex');

    // Take the last 20 bytes (remove the leading 12 zero bytes)
    const addressBytes = buffer.slice(12, 32);

    // Add Tron prefix 0x41
    const addressWithPrefix = Buffer.concat([
      Buffer.from([0x41]),
      addressBytes
    ]);

    // Calculate checksum (first 4 bytes of double SHA256)
    const hash1 = await sha256(new Uint8Array(addressWithPrefix));
    const hash2 = await sha256(hash1);
    const checksum = Buffer.from(hash2.slice(0, 4));

    // Combine: prefix + address + checksum
    const fullAddress = Buffer.concat([addressWithPrefix, checksum]);

    // Base58 encoding
    return bs58.encode(fullAddress);
  } catch (error: any) {
    throw new Error(`Failed to convert bytes32 to Tron address: ${error.message}`);
  }
}

/**
 * Converts Solana address to bytes32 format (for LayerZero OFT)
 * @param {string} solanaAddress - Solana address in Base58 format
 * @returns {string} Address in bytes32 format (starts with 0x, left-padded with zeros)
 */
export function solanaAddressToBytes32(solanaAddress: string) {
  // Decode the Solana address from base58 format
  const decoded = bs58.decode(solanaAddress);

  // Validate length (Solana public key is 32 bytes)
  if (decoded.length !== 32) {
    throw new Error('Invalid Solana address length');
  }

  // Convert to hexadecimal string
  return '0x' + Buffer.from(decoded).toString('hex');
}

/**
 * Converts bytes32 to Solana address
 * @param {string} bytes32Address - Address in bytes32 format
 * @returns {string} Solana address in Base58 format
 */
export function bytes32ToSolanaAddress(bytes32Address: string) {
  const hexString = bytes32Address.startsWith('0x')
    ? bytes32Address.slice(2)
    : bytes32Address;

  const buffer = Buffer.from(hexString, 'hex');

  // Encode as base58
  return bs58.encode(buffer);
}

export function addressToBytes32(chainType: string, address: string) {
  if (chainType === "evm") {
    return zeroPadValue(address, 32);
  }
  if (chainType === "sol") {
    return solanaAddressToBytes32(address);
  }
  if (chainType === "tron") {
    return tronAddressToBytes32(address);
  }
}
