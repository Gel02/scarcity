/**
 * Witness integration adapter
 *
 * Provides timestamped attestations for Scarcity transfers using
 * threshold signature-based timestamping without blockchain.
 */

import { Crypto } from '../crypto.js';
import type { WitnessClient, Attestation } from '../types.js';

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
          const signatures = data.attestation?.signatures?.map((sig: any) =>
            typeof sig.signature === 'string' ? sig.signature : JSON.stringify(sig.signature)
          ) || [];

          const witnessIds = data.attestation?.signatures?.map((sig: any) =>
            sig.witness_id
          ) || [];

          return {
            hash: data.attestation?.attestation?.hash || hash,
            timestamp: data.attestation?.attestation?.timestamp || Date.now(),
            signatures,
            witnessIds
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
   */
  async verify(attestation: Attestation): Promise<boolean> {
    await this.init();

    // Attempt real verification if gateway is available
    if (this.config) {
      try {
        // Transform Scarcity's Attestation format to Witness API format
        const witnessAttestation = {
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
        console.warn('[Witness] Verification failed, using fallback:', error);
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
