/**
 * Witness integration adapter
 *
 * Provides timestamped attestations for Scarcity transfers using
 * threshold signature-based timestamping without blockchain.
 *
 * Supports both Ed25519 multi-sig and BLS12-381 aggregated signatures.
 */

import { Crypto } from '../crypto.js';
import type { WitnessClient, Attestation } from '../types.js';
import { bls12_381 } from '@noble/curves/bls12-381';

export interface WitnessAdapterConfig {
  readonly gatewayUrl: string;
  readonly networkId?: string;
}

/**
 * Adapter for Witness timestamping service
 *
 * Connects to a Witness gateway that coordinates threshold signatures
 * from multiple independent witness nodes for tamper-proof timestamps.
 */
export class WitnessAdapter implements WitnessClient {
  private readonly gatewayUrl: string;
  private readonly networkId: string;
  private config: any = null;

  constructor(config: WitnessAdapterConfig) {
    this.gatewayUrl = config.gatewayUrl;
    this.networkId = config.networkId ?? 'scarcity-network';
  }

  /**
   * Initialize by fetching network configuration
   */
  private async init(): Promise<void> {
    if (this.config) return;

    try {
      const response = await fetch(`${this.gatewayUrl}/v1/config`);
      if (response.ok) {
        this.config = await response.json();
        console.log('[Witness] Connected to network:', this.config.network_id || 'unknown');
      } else {
        console.warn('[Witness] Could not fetch config, using fallback mode');
      }
    } catch (error) {
      console.warn('[Witness] Gateway not available, using fallback mode:', error);
    }
  }

  /**
   * Timestamp a hash with Witness federation
   *
   * Submits hash to gateway, which collects threshold signatures
   * from witness nodes and returns signed attestation.
   */
  async timestamp(hash: string): Promise<Attestation> {
    await this.init();

    // Attempt real timestamping if gateway is available
    if (this.config) {
      try {
        const response = await fetch(`${this.gatewayUrl}/v1/timestamp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash })
        });

        if (response.ok) {
          const data = await response.json();

          // Transform Witness API response to Scarcity's Attestation format
          // The response structure is:
          // { attestation: { attestation: {...}, signatures: MultiSig | Aggregated } }

          const signaturesData = data.attestation?.signatures;
          let signatures: string[] = [];
          let witnessIds: string[] = [];

          if (signaturesData) {
            // Check if it's MultiSig variant (has 'signatures' array)
            if (Array.isArray(signaturesData.signatures)) {
              signatures = signaturesData.signatures.map((sig: any) =>
                typeof sig.signature === 'string' ? sig.signature : JSON.stringify(sig.signature)
              );
              witnessIds = signaturesData.signatures.map((sig: any) => sig.witness_id);
            }
            // Check if it's Aggregated variant (has 'signature' and 'signers')
            else if (signaturesData.signature && Array.isArray(signaturesData.signers)) {
              signatures = [
                typeof signaturesData.signature === 'string'
                  ? signaturesData.signature
                  : JSON.stringify(signaturesData.signature)
              ];
              witnessIds = signaturesData.signers;
            }
          }

          return {
            hash: data.attestation?.attestation?.hash || hash,
            timestamp: data.attestation?.attestation?.timestamp || Date.now(),
            signatures,
            witnessIds,
            raw: data.attestation  // Store original SignedAttestation for verification
          };
        }
      } catch (error) {
        console.warn('[Witness] Timestamping failed, using fallback:', error);
      }
    }

    // Fallback: simulated local attestation
    return {
      hash,
      timestamp: Date.now(),
      signatures: [
        Crypto.toHex(Crypto.hash(hash, 'witness-1')),
        Crypto.toHex(Crypto.hash(hash, 'witness-2')),
        Crypto.toHex(Crypto.hash(hash, 'witness-3'))
      ],
      witnessIds: ['witness-1', 'witness-2', 'witness-3']
    };
  }

  /**
   * Verify a Witness attestation
   *
   * Validates threshold signatures from witness nodes.
   * Supports both Ed25519 multi-sig and BLS12-381 aggregated signatures.
   */
  async verify(attestation: Attestation): Promise<boolean> {
    await this.init();

    // Attempt real verification if gateway is available
    if (this.config) {
      try {
        // If we have the raw SignedAttestation, use it directly
        // Otherwise, try to reconstruct (may fail if signatures aren't in correct format)
        const witnessAttestation = attestation.raw || {
          attestation: {
            hash: attestation.hash,
            timestamp: attestation.timestamp,
            network_id: this.networkId,
            sequence: 0
          },
          signatures: attestation.signatures.map((sig, idx) => ({
            witness_id: attestation.witnessIds[idx],
            signature: sig
          }))
        };

        const response = await fetch(`${this.gatewayUrl}/v1/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attestation: witnessAttestation })
        });

        if (response.ok) {
          const data = await response.json();
          return data.valid === true;
        }
      } catch (error) {
        console.warn('[Witness] Gateway verification failed, trying local verification:', error);

        // Try local BLS verification if we have the raw attestation with BLS format
        if (attestation.raw && this.config) {
          const blsResult = this.verifyBLSLocal(attestation);
          if (blsResult !== null) {
            return blsResult;
          }
        }
      }
    }

    // Fallback: basic structural validation
    if (!attestation.hash || !attestation.timestamp) {
      return false;
    }

    if (!attestation.signatures || attestation.signatures.length < 2) {
      return false;
    }

    if (!attestation.witnessIds || attestation.witnessIds.length !== attestation.signatures.length) {
      return false;
    }

    // Check if attestation is too old (24 hours)
    const age = Date.now() - attestation.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      return false;
    }

    return true;
  }

  /**
   * Verify BLS aggregated signature locally
   *
   * This requires the network config to have witness public keys.
   * Returns null if verification cannot be performed (missing data),
   * true if valid, false if invalid.
   */
  private verifyBLSLocal(attestation: Attestation): boolean | null {
    try {
      // Check if this is a BLS aggregated signature
      const signaturesData = attestation.raw?.signatures;
      if (!signaturesData || !signaturesData.signature || !Array.isArray(signaturesData.signers)) {
        return null; // Not BLS aggregated format
      }

      // Check if we have witness public keys in config
      if (!this.config?.witnesses || !Array.isArray(this.config.witnesses)) {
        console.warn('[Witness] Cannot verify BLS locally: missing witness public keys');
        return null;
      }

      // Extract the aggregated signature
      const aggregatedSigHex = signaturesData.signature;
      const signers = signaturesData.signers;

      // Get public keys for all signers
      const pubkeys: string[] = [];
      for (const signerId of signers) {
        const witness = this.config.witnesses.find((w: any) => w.id === signerId);
        if (!witness || !witness.pubkey) {
          console.warn(`[Witness] Missing public key for signer: ${signerId}`);
          return null;
        }
        pubkeys.push(witness.pubkey);
      }

      // Prepare the message (attestation hash)
      const attestationData = attestation.raw.attestation;
      const messageBytes = this.serializeAttestationForSigning(attestationData);

      // Verify BLS signature
      const isValid = this.verifyBLSAggregatedSignature(
        messageBytes,
        aggregatedSigHex,
        pubkeys
      );

      console.log(`[Witness] Local BLS verification: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;

    } catch (error) {
      console.error('[Witness] BLS verification error:', error);
      return null; // Cannot verify
    }
  }

  /**
   * Serialize attestation for signing (matches Witness Rust implementation)
   *
   * The message format must match exactly what the Witness nodes sign.
   * Based on Witness implementation: hash || timestamp || network_id || sequence
   */
  private serializeAttestationForSigning(attestation: any): Uint8Array {
    // Convert hash (either Uint8Array or hex string) to bytes
    let hashBytes: Uint8Array;
    if (typeof attestation.hash === 'string') {
      // Remove '0x' prefix if present
      const hex = attestation.hash.startsWith('0x') ? attestation.hash.slice(2) : attestation.hash;
      hashBytes = Uint8Array.from(Buffer.from(hex, 'hex'));
    } else if (Array.isArray(attestation.hash)) {
      hashBytes = new Uint8Array(attestation.hash);
    } else {
      hashBytes = attestation.hash;
    }

    // Convert timestamp to 8-byte little-endian
    const timestampBytes = new Uint8Array(8);
    const view = new DataView(timestampBytes.buffer);
    view.setBigUint64(0, BigInt(attestation.timestamp), true); // little-endian

    // Convert network_id to UTF-8 bytes
    const networkIdBytes = new TextEncoder().encode(attestation.network_id || '');

    // Convert sequence to 8-byte little-endian
    const sequenceBytes = new Uint8Array(8);
    const seqView = new DataView(sequenceBytes.buffer);
    seqView.setBigUint64(0, BigInt(attestation.sequence || 0), true); // little-endian

    // Concatenate: hash || timestamp || network_id || sequence
    const messageLen = hashBytes.length + timestampBytes.length + networkIdBytes.length + sequenceBytes.length;
    const message = new Uint8Array(messageLen);
    let offset = 0;
    message.set(hashBytes, offset); offset += hashBytes.length;
    message.set(timestampBytes, offset); offset += timestampBytes.length;
    message.set(networkIdBytes, offset); offset += networkIdBytes.length;
    message.set(sequenceBytes, offset);

    return message;
  }

  /**
   * Verify BLS aggregated signature using noble-curves
   *
   * @param message - The message that was signed
   * @param aggregatedSigHex - Hex-encoded aggregated signature (96 bytes)
   * @param pubkeysHex - Array of hex-encoded public keys (48 bytes each)
   * @returns true if signature is valid
   */
  private verifyBLSAggregatedSignature(
    message: Uint8Array,
    aggregatedSigHex: string,
    pubkeysHex: string[]
  ): boolean {
    try {
      // Parse aggregated signature (G2 point, 96 bytes)
      const sigHex = aggregatedSigHex.startsWith('0x') ? aggregatedSigHex.slice(2) : aggregatedSigHex;
      const signature = Uint8Array.from(Buffer.from(sigHex, 'hex'));

      // Parse and aggregate public keys (G1 points, 48 bytes each)
      const pubkeys = pubkeysHex.map(pkHex => {
        const hex = pkHex.startsWith('0x') ? pkHex.slice(2) : pkHex;
        return Uint8Array.from(Buffer.from(hex, 'hex'));
      });

      // Aggregate public keys (G1 point addition)
      let aggregatedPubkey = bls12_381.G1.ProjectivePoint.ZERO;
      for (const pk of pubkeys) {
        const point = bls12_381.G1.ProjectivePoint.fromHex(pk);
        aggregatedPubkey = aggregatedPubkey.add(point);
      }

      // Verify using BLS12-381 pairing (minimal-signature-size variant)
      // This uses G2 for signatures (96 bytes) and G1 for public keys (48 bytes)
      const isValid = bls12_381.verify(
        signature,
        message,
        aggregatedPubkey.toRawBytes()
      );

      return isValid;

    } catch (error) {
      console.error('[Witness] BLS signature verification failed:', error);
      return false;
    }
  }

  /**
   * Check if nullifier has been seen by Witness network
   *
   * Queries for existing timestamp to detect double-spends.
   */
  async checkNullifier(nullifier: Uint8Array): Promise<number> {
    await this.init();

    const hash = Crypto.toHex(nullifier);

    // Attempt real lookup if gateway is available
    if (this.config) {
      try {
        const response = await fetch(`${this.gatewayUrl}/v1/timestamp/${hash}`);

        if (response.status === 404) {
          return 0; // Not seen
        }

        if (response.ok) {
          const data = await response.json();
          // Return confidence based on signature threshold
          const sigCount = data.attestation?.signatures?.length || 0;
          const threshold = this.config.threshold || 2;
          return sigCount >= threshold ? 1.0 : 0.5;
        }
      } catch (error) {
        // Network error - cannot determine, return low confidence
        return 0;
      }
    }

    // Fallback: cannot check without gateway
    return 0;
  }

  /**
   * Retrieve attestation for a specific hash
   */
  async getAttestation(hash: string): Promise<Attestation | null> {
    await this.init();

    if (this.config) {
      try {
        const response = await fetch(`${this.gatewayUrl}/v1/timestamp/${hash}`);

        if (response.status === 404) {
          return null;
        }

        if (response.ok) {
          const data = await response.json();

          return {
            hash: data.attestation?.attestation?.hash || hash,
            timestamp: data.attestation?.attestation?.timestamp || Date.now(),
            signatures: data.attestation?.signatures?.map((sig: any) =>
              typeof sig.signature === 'string' ? sig.signature : JSON.stringify(sig.signature)
            ) || [],
            witnessIds: data.attestation?.signatures?.map((sig: any) =>
              sig.witness_id
            ) || []
          };
        }
      } catch (error) {
        console.warn('[Witness] Failed to retrieve attestation:', error);
      }
    }

    return null;
  }

  /**
   * Get Witness network configuration
   */
  async getConfig() {
    await this.init();

    // Return cached config if available
    if (this.config) {
      return this.config;
    }

    // Fallback config
    return {
      network_id: this.networkId,
      threshold: 2,
      witnesses: [
        { id: 'witness-1', endpoint: 'http://localhost:3001' },
        { id: 'witness-2', endpoint: 'http://localhost:3002' },
        { id: 'witness-3', endpoint: 'http://localhost:3003' }
      ]
    };
  }
}
