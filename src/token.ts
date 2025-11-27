/**
 * ScarceToken: Privacy-preserving P2P value transfer
 */

import { Crypto } from './crypto.js';
import type {
  PublicKey,
  TransferPackage,
  FreebirdClient,
  WitnessClient,
  GossipNetwork,
  Attestation
} from './types.js';

export interface ScarceTokenConfig {
  readonly id: string;
  readonly amount: number;
  readonly secret: Uint8Array;
  readonly freebird: FreebirdClient;
  readonly witness: WitnessClient;
  readonly gossip: GossipNetwork;
}

export class ScarceToken {
  private readonly id: string;
  private readonly amount: number;
  private readonly secret: Uint8Array;
  private readonly freebird: FreebirdClient;
  private readonly witness: WitnessClient;
  private readonly gossip: GossipNetwork;
  private spent: boolean = false;

  constructor(config: ScarceTokenConfig) {
    this.id = config.id;
    this.amount = config.amount;
    this.secret = config.secret;
    this.freebird = config.freebird;
    this.witness = config.witness;
    this.gossip = config.gossip;
  }

  /**
   * Transfer token to new owner
   *
   * Protocol:
   * 1. Generate nullifier (prevents double-spend)
   * 2. Create blinded commitment to recipient (privacy)
   * 3. Package transfer data
   * 4. Timestamp with Witness (proof of order)
   * 5. Broadcast nullifier to gossip network
   *
   * @param to - Recipient's public key
   * @returns Transfer package for recipient
   */
  async transfer(to: PublicKey): Promise<TransferPackage> {
    if (this.spent) {
      throw new Error('Token already spent');
    }

    // A. Create nullifier (unique spend identifier)
    const timestamp = Date.now();
    const nullifier = Crypto.generateNullifier(
      this.secret,
      this.id,
      timestamp
    );

    // B. Blind commitment to recipient (privacy-preserving)
    // In production: use Freebird's VOPRF blinding
    const commitment = await this.freebird.blind(to);

    // C. Create ownership proof (proves we have the right to spend)
    const ownershipProof = await this.freebird.createOwnershipProof(this.secret);

    // D. Package transfer data
    const pkg = {
      tokenId: this.id,
      amount: this.amount,
      commitment,
      nullifier
    };

    // E. Hash package for timestamping
    const pkgHash = Crypto.hashTransferPackage(pkg);

    // F. Timestamp the transfer with Witness (proof of order)
    const proof = await this.witness.timestamp(pkgHash);

    // G. Broadcast nullifier to gossip network (fast propagation)
    await this.gossip.publish(nullifier, proof);

    // H. Mark as spent
    this.spent = true;

    // I. Return complete transfer package
    return {
      ...pkg,
      proof,
      ownershipProof
    };
  }

  /**
   * Create a new token from scratch (minting)
   *
   * @param amount - Token amount
   * @param freebird - Freebird client
   * @param witness - Witness client
   * @param gossip - Gossip network
   * @returns New ScarceToken instance
   */
  static mint(
    amount: number,
    freebird: FreebirdClient,
    witness: WitnessClient,
    gossip: GossipNetwork
  ): ScarceToken {
    const id = Crypto.toHex(Crypto.randomBytes(32));
    const secret = Crypto.randomBytes(32);

    return new ScarceToken({
      id,
      amount,
      secret,
      freebird,
      witness,
      gossip
    });
  }

  /**
   * Receive a token from transfer package
   *
   * @param pkg - Transfer package from sender
   * @param recipientSecret - Recipient's secret key
   * @param freebird - Freebird client
   * @param witness - Witness client
   * @param gossip - Gossip network
   * @returns New ScarceToken instance for recipient
   */
  static async receive(
    pkg: TransferPackage,
    recipientSecret: Uint8Array,
    freebird: FreebirdClient,
    witness: WitnessClient,
    gossip: GossipNetwork
  ): Promise<ScarceToken> {
    // Verify the transfer proof
    const valid = await witness.verify(pkg.proof);
    if (!valid) {
      throw new Error('Invalid transfer proof');
    }

    // Verify ownership proof if present
    if (pkg.ownershipProof) {
      const ownershipValid = await freebird.verifyToken(pkg.ownershipProof);
      if (!ownershipValid) {
        throw new Error('Invalid ownership proof');
      }
    }

    // Create new token for recipient
    // Note: In production, recipientSecret would be used to unblind the commitment
    return new ScarceToken({
      id: pkg.tokenId,
      amount: pkg.amount,
      secret: recipientSecret,
      freebird,
      witness,
      gossip
    });
  }

  /**
   * Get token metadata (safe to share)
   */
  getMetadata() {
    return {
      id: this.id,
      amount: this.amount,
      spent: this.spent
    };
  }

  /**
   * Check if token has been spent
   */
  isSpent(): boolean {
    return this.spent;
  }
}
