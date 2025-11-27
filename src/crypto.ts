/**
 * Cryptographic primitives for Scarce protocol
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';
import { randomBytes } from 'crypto';

export class Crypto {
  /**
   * Generate cryptographically secure random bytes
   */
  static randomBytes(length: number): Uint8Array {
    return randomBytes(length);
  }

  /**
   * Hash arbitrary data with SHA-256
   */
  static hash(...inputs: (Uint8Array | string | number)[]): Uint8Array {
    const combined = inputs.map(input => {
      if (typeof input === 'string') {
        return new TextEncoder().encode(input);
      } else if (typeof input === 'number') {
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setBigUint64(0, BigInt(input), false);
        return new Uint8Array(buf);
      }
      return input;
    });

    return sha256(concatBytes(...combined));
  }

  /**
   * Convert bytes to hex string
   */
  static toHex(bytes: Uint8Array): string {
    return bytesToHex(bytes);
  }

  /**
   * Convert hex string to bytes
   */
  static fromHex(hex: string): Uint8Array {
    return hexToBytes(hex);
  }

  /**
   * Generate nullifier from secret, token ID, and timestamp
   * Nullifier = H(secret || tokenId || timestamp)
   */
  static generateNullifier(
    secret: Uint8Array,
    tokenId: string,
    timestamp: number
  ): Uint8Array {
    return this.hash(secret, tokenId, timestamp);
  }

  /**
   * Constant-time comparison of byte arrays
   */
  static constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }

    return result === 0;
  }

  /**
   * Generate a commitment to recipient public key
   * In production this would use Freebird's blinding
   */
  static async createCommitment(publicKey: Uint8Array): Promise<Uint8Array> {
    const nonce = this.randomBytes(32);
    return this.hash(publicKey, nonce);
  }

  /**
   * Hash transfer package for Witness timestamping
   */
  static hashTransferPackage(pkg: {
    tokenId: string;
    amount: number;
    commitment: Uint8Array;
    nullifier: Uint8Array;
  }): string {
    const hash = this.hash(
      pkg.tokenId,
      pkg.amount,
      pkg.commitment,
      pkg.nullifier
    );
    return this.toHex(hash);
  }
}
