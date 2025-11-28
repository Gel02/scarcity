/**
 * Freebird integration adapter
 *
 * Provides anonymous authorization and blinding for Scarcity tokens.
 *
 * NOTE: Scarcity's use of Freebird is conceptual. The current interface
 * uses Freebird as a generic blinding primitive, while Freebird's actual
 * SDK is designed for anonymous token issuance. Full VOPRF integration
 * is planned for Phase 2.
 */

import { Crypto } from '../crypto.js';
import type { FreebirdClient, PublicKey } from '../types.js';

export interface FreebirdAdapterConfig {
  readonly issuerUrl: string;
  readonly verifierUrl: string;
}

/**
 * Adapter for Freebird anonymous authorization service
 *
 * This implementation uses HTTP calls to Freebird's REST API endpoints.
 * For now, we simulate the blinding operations that Scarcity needs.
 * Future work will integrate full VOPRF protocol from Freebird SDK.
 */
export class FreebirdAdapter implements FreebirdClient {
  private readonly issuerUrl: string;
  private readonly verifierUrl: string;
  private metadata: any = null;

  constructor(config: FreebirdAdapterConfig) {
    this.issuerUrl = config.issuerUrl;
    this.verifierUrl = config.verifierUrl;
  }

  /**
   * Initialize by fetching issuer metadata
   */
  private async init(): Promise<void> {
    if (this.metadata) return;

    try {
      const response = await fetch(`${this.issuerUrl}/.well-known/issuer`);
      if (response.ok) {
        this.metadata = await response.json();
        console.log('[Freebird] Connected to issuer:', this.metadata.issuer_id);
      } else {
        console.warn('[Freebird] Could not fetch issuer metadata, using fallback mode');
      }
    } catch (error) {
      console.warn('[Freebird] Issuer not available, using fallback mode:', error);
    }
  }

  /**
   * Blind a public key for privacy-preserving commitment
   *
   * Current: Simulated blinding using hash
   * Future: Use Freebird's VOPRF blind() crypto primitive
   */
  async blind(publicKey: PublicKey): Promise<Uint8Array> {
    await this.init();

    // Simulated blinding - combines public key with random nonce
    // In production VOPRF: blind = H(publicKey)^r for random r
    const nonce = Crypto.randomBytes(32);
    return Crypto.hash(publicKey.bytes, nonce);
  }

  /**
   * Issue an authorization token
   *
   * Current: Simulated token issuance
   * Future: POST to /v1/oprf/issue with blinded element
   */
  async issueToken(blindedValue: Uint8Array): Promise<Uint8Array> {
    await this.init();

    // Attempt real issuance if issuer is available
    if (this.metadata) {
      try {
        const response = await fetch(`${this.issuerUrl}/v1/oprf/issue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blinded_element_b64: Buffer.from(blindedValue).toString('base64url'),
            sybil_proof: { type: 'none' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          return Buffer.from(data.token, 'base64url');
        }
      } catch (error) {
        console.warn('[Freebird] Token issuance failed, using fallback:', error);
      }
    }

    // Fallback: simulated token
    return Crypto.hash(blindedValue, 'ISSUED');
  }

  /**
   * Verify an authorization token
   *
   * Current: Basic validation
   * Future: POST to /v1/verify with full DLEQ proof verification
   */
  async verifyToken(token: Uint8Array): Promise<boolean> {
    await this.init();

    // Attempt real verification if verifier is available
    if (this.metadata && this.verifierUrl) {
      try {
        const response = await fetch(`${this.verifierUrl}/v1/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token_b64: Buffer.from(token).toString('base64url'),
            issuer_id: this.metadata.issuer_id,
            exp: Math.floor(Date.now() / 1000) + 3600,
            epoch: this.metadata.epoch || 0  // Key rotation epoch
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.ok === true;  // Changed from data.valid to data.ok
        }
      } catch (error) {
        console.warn('[Freebird] Token verification failed, using fallback:', error);
      }
    }

    // Fallback: basic length check
    return token.length === 32;
  }

  /**
   * Create ownership proof for token spending
   *
   * Current: Hash-based proof
   * Future: VOPRF-based unforgeable proof using Freebird crypto
   */
  async createOwnershipProof(secret: Uint8Array): Promise<Uint8Array> {
    // This would ideally use VOPRF to create a proof that:
    // 1. Proves knowledge of secret without revealing it
    // 2. Is unforgeable (cannot be created without the secret)
    // 3. Is unlinkable (cannot correlate proofs to the same secret)
    //
    // For now: deterministic hash as placeholder
    return Crypto.hash(secret, 'OWNERSHIP_PROOF');
  }
}
