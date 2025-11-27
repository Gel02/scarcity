/**
 * NullifierGossip: P2P nullifier set propagation
 *
 * Implements fast, probabilistic double-spend detection through
 * gossip-based broadcast of spent token nullifiers.
 */

import { Crypto } from './crypto.js';
import type {
  PeerConnection,
  GossipMessage,
  Attestation,
  WitnessClient
} from './types.js';

export interface GossipConfig {
  readonly witness: WitnessClient;
  readonly maxNullifiers?: number;
  readonly pruneInterval?: number;
}

export class NullifierGossip {
  private readonly seenNullifiers = new Map<string, NullifierRecord>();
  private readonly peerConnections: PeerConnection[] = [];
  private readonly witness: WitnessClient;
  private readonly maxNullifiers: number;
  private readonly pruneInterval: number;
  private receiveHandler?: (data: GossipMessage) => Promise<void>;
  private pruneTimer?: NodeJS.Timeout;

  constructor(config: GossipConfig) {
    this.witness = config.witness;
    this.maxNullifiers = config.maxNullifiers ?? 100_000;
    this.pruneInterval = config.pruneInterval ?? 3600_000; // 1 hour

    // Start pruning old nullifiers periodically
    this.startPruning();
  }

  /**
   * Publish a nullifier to the gossip network
   *
   * @param nullifier - Unique spend identifier
   * @param proof - Witness attestation
   */
  async publish(nullifier: Uint8Array, proof: Attestation): Promise<void> {
    const key = Crypto.toHex(nullifier);

    // Check if already spent
    if (this.seenNullifiers.has(key)) {
      throw new Error('Double-spend detected! Nullifier already published.');
    }

    // Add to local set with metadata
    this.seenNullifiers.set(key, {
      nullifier,
      proof,
      firstSeen: Date.now(),
      peerCount: 1
    });

    // Broadcast to all peers
    const message: GossipMessage = {
      type: 'nullifier',
      nullifier,
      proof,
      timestamp: Date.now()
    };

    await this.broadcast(message);
  }

  /**
   * Check if nullifier has been seen
   *
   * @param nullifier - Nullifier to check
   * @returns Confidence score (0-1), where 0 = never seen, 1 = widely propagated
   */
  async checkNullifier(nullifier: Uint8Array): Promise<number> {
    const key = Crypto.toHex(nullifier);
    const record = this.seenNullifiers.get(key);

    if (!record) {
      return 0; // Never seen
    }

    // Compute confidence based on:
    // - How many peers reported it
    // - How long ago it was first seen
    // - How many total peers we have

    const peerConfidence = Math.min(
      record.peerCount / Math.max(this.peerConnections.length, 1),
      1.0
    );

    const ageMs = Date.now() - record.firstSeen;
    const ageConfidence = Math.min(ageMs / 10_000, 1.0); // Max confidence after 10s

    return Math.max(peerConfidence, ageConfidence);
  }

  /**
   * Receive nullifier from peer
   *
   * @param data - Gossip message from peer
   */
  async onReceive(data: GossipMessage): Promise<void> {
    if (data.type !== 'nullifier' || !data.nullifier || !data.proof) {
      return;
    }

    // Verify timestamp proof
    const valid = await this.witness.verify(data.proof);
    if (!valid) {
      console.warn('Received invalid nullifier proof, ignoring');
      return;
    }

    const key = Crypto.toHex(data.nullifier);
    const existing = this.seenNullifiers.get(key);

    if (!existing) {
      // First time seeing this nullifier
      this.seenNullifiers.set(key, {
        nullifier: data.nullifier,
        proof: data.proof,
        firstSeen: Date.now(),
        peerCount: 1
      });

      // Propagate to other peers (epidemic broadcast)
      await this.broadcast(data, true);
    } else {
      // Increment peer count (saw from another source)
      existing.peerCount++;
    }

    // Call user handler if registered
    if (this.receiveHandler) {
      await this.receiveHandler(data);
    }
  }

  /**
   * Register handler for received messages
   */
  setReceiveHandler(handler: (data: GossipMessage) => Promise<void>): void {
    this.receiveHandler = handler;
  }

  /**
   * Add peer connection
   */
  addPeer(peer: PeerConnection): void {
    this.peerConnections.push(peer);
  }

  /**
   * Remove peer connection
   */
  removePeer(peerId: string): void {
    const index = this.peerConnections.findIndex(p => p.id === peerId);
    if (index !== -1) {
      this.peerConnections.splice(index, 1);
    }
  }

  /**
   * Get current peer list
   */
  get peers(): PeerConnection[] {
    return [...this.peerConnections];
  }

  /**
   * Get gossip network statistics
   */
  getStats() {
    return {
      nullifierCount: this.seenNullifiers.size,
      peerCount: this.peerConnections.length,
      activePeers: this.peerConnections.filter(p => p.isConnected()).length
    };
  }

  /**
   * Broadcast message to all peers
   */
  private async broadcast(message: GossipMessage, skipFailed = false): Promise<void> {
    const promises = this.peerConnections
      .filter(peer => peer.isConnected())
      .map(async (peer) => {
        try {
          await peer.send(message);
        } catch (error) {
          if (!skipFailed) {
            throw error;
          }
          console.warn(`Failed to send to peer ${peer.id}:`, error);
        }
      });

    await Promise.all(promises);
  }

  /**
   * Prune old nullifiers to prevent unbounded growth
   */
  private startPruning(): void {
    this.pruneTimer = setInterval(() => {
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours

      // Remove nullifiers older than cutoff
      for (const [key, record] of this.seenNullifiers.entries()) {
        if (record.firstSeen < cutoff) {
          this.seenNullifiers.delete(key);
        }
      }

      // If still over limit, remove oldest entries
      if (this.seenNullifiers.size > this.maxNullifiers) {
        const entries = Array.from(this.seenNullifiers.entries())
          .sort((a, b) => a[1].firstSeen - b[1].firstSeen);

        const toRemove = entries.slice(0, this.seenNullifiers.size - this.maxNullifiers);
        for (const [key] of toRemove) {
          this.seenNullifiers.delete(key);
        }
      }
    }, this.pruneInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
  }
}

interface NullifierRecord {
  nullifier: Uint8Array;
  proof: Attestation;
  firstSeen: number;
  peerCount: number;
}
