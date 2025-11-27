/**
 * HyperToken integration adapter
 *
 * Provides P2P network connectivity for gossip protocol using HyperToken's
 * PeerConnection for WebSocket-based P2P networking.
 */

import { PeerConnection as HTPeerConnection } from '../vendor/hypertoken/PeerConnection.js';
import type { PeerConnection, GossipMessage } from '../types.js';

export interface HyperTokenAdapterConfig {
  readonly relayUrl?: string;
}

/**
 * Wrapper that adapts HyperToken's event-driven PeerConnection
 * to Scarcity's PeerConnection interface
 */
class HyperTokenPeerWrapper implements PeerConnection {
  readonly id: string;
  private htPeerConnection: HTPeerConnection;
  private messageHandler?: (data: GossipMessage) => void;
  private targetPeerId: string;

  constructor(htPeerConnection: HTPeerConnection, targetPeerId: string) {
    this.htPeerConnection = htPeerConnection;
    this.targetPeerId = targetPeerId;
    this.id = targetPeerId;
  }

  async send(data: GossipMessage): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(`Peer ${this.id} is not connected`);
    }

    // Send message to specific peer using HyperToken's sendToPeer
    this.htPeerConnection.sendToPeer(this.targetPeerId, data);
  }

  isConnected(): boolean {
    return this.htPeerConnection.connected && this.htPeerConnection.peers.has(this.targetPeerId);
  }

  /**
   * Set handler for incoming messages from this peer
   * Note: This is called by NullifierGossip's internal wiring
   */
  setMessageHandler(handler: (data: GossipMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Internal: Called by HyperTokenAdapter when a message arrives from this peer
   */
  _handleIncomingMessage(data: GossipMessage): void {
    if (this.messageHandler) {
      this.messageHandler(data);
    }
  }
}

/**
 * Adapter for HyperToken P2P networking
 *
 * Provides WebSocket-based P2P connectivity through a relay server.
 * Each HyperTokenAdapter instance represents a single peer in the gossip network.
 */
export class HyperTokenAdapter {
  private readonly relayUrl: string;
  private htConnection: HTPeerConnection | null = null;
  private peerWrappers = new Map<string, HyperTokenPeerWrapper>();
  private isReady = false;
  private readyPromise: Promise<void>;
  private readyResolve?: () => void;
  private readyReject?: (error: Error) => void;

  constructor(config: HyperTokenAdapterConfig = {}) {
    this.relayUrl = config.relayUrl ?? 'ws://localhost:8080';

    // Create a promise that resolves when connection is ready
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
  }

  /**
   * Connect to relay server
   */
  async connect(): Promise<void> {
    this.htConnection = new HTPeerConnection(this.relayUrl, null);

    // Set up event handlers
    this.htConnection.on('net:ready', (evt: any) => {
      this.isReady = true;
      console.log(`[HyperToken] Connected with peer ID: ${evt.payload.peerId}`);
      if (this.readyResolve) {
        this.readyResolve();
      }
    });

    this.htConnection.on('net:peer:connected', (evt: any) => {
      const peerId = evt.payload.peerId;
      console.log(`[HyperToken] Peer joined: ${peerId}`);
    });

    this.htConnection.on('net:peer:disconnected', (evt: any) => {
      const peerId = evt.payload.peerId;
      console.log(`[HyperToken] Peer left: ${peerId}`);
      this.peerWrappers.delete(peerId);
    });

    this.htConnection.on('net:message', (evt: any) => {
      // Route message to appropriate peer wrapper
      const fromPeerId = evt.payload?.fromPeerId || evt.fromPeerId;
      if (fromPeerId) {
        const wrapper = this.peerWrappers.get(fromPeerId);
        if (wrapper) {
          // Extract the actual gossip message from the payload
          const message = evt.payload?.data || evt.payload;
          wrapper._handleIncomingMessage(message);
        }
      }
    });

    this.htConnection.on('net:error', (evt: any) => {
      const error = evt.payload?.error || new Error('Unknown network error');
      console.error(`[HyperToken] Network error:`, error);
      if (this.readyReject && !this.isReady) {
        this.readyReject(error);
      }
    });

    // Initiate connection
    this.htConnection.connect();

    // Set timeout for connection
    const timeout = setTimeout(() => {
      if (!this.isReady && this.readyReject) {
        this.readyReject(new Error('Connection timeout'));
      }
    }, 10000); // 10 second timeout

    // Wait for connection to be ready
    try {
      await this.readyPromise;
      clearTimeout(timeout);
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Create a peer connection wrapper for a specific peer
   *
   * Note: This creates a virtual peer connection. The actual peer
   * may not be connected yet - that happens dynamically as peers
   * join the relay server.
   *
   * In fallback mode (when not connected), this creates a mock peer
   * that can be used for testing but won't actually send/receive data.
   */
  createPeer(peerId?: string): PeerConnection {
    // Generate peer ID if not provided
    const targetPeerId = peerId ?? this.generatePeerId();

    // If not connected, create a mock peer for fallback mode
    if (!this.htConnection) {
      return {
        id: targetPeerId,
        async send(_data: GossipMessage): Promise<void> {
          // No-op in fallback mode
        },
        isConnected(): boolean {
          return false;
        }
      };
    }

    // Create wrapper
    const wrapper = new HyperTokenPeerWrapper(this.htConnection, targetPeerId);
    this.peerWrappers.set(targetPeerId, wrapper);

    return wrapper;
  }

  /**
   * Get all connected peer wrappers
   */
  getPeers(): PeerConnection[] {
    return Array.from(this.peerWrappers.values());
  }

  /**
   * Get our peer ID assigned by the relay server
   */
  getMyPeerId(): string | null {
    return this.htConnection?.peerId ?? null;
  }

  /**
   * Get list of actually connected peer IDs from relay server
   */
  getConnectedPeerIds(): string[] {
    return this.htConnection?.peers ? Array.from(this.htConnection.peers) : [];
  }

  /**
   * Disconnect from network
   */
  disconnect(): void {
    if (this.htConnection) {
      this.htConnection.disconnect();
      this.peerWrappers.clear();
      this.isReady = false;
    }
  }

  private generatePeerId(): string {
    return `peer-${Math.random().toString(36).substring(2, 11)}`;
  }
}
