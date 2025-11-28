/**
 * HyperToken integration adapter
 *
<<<<<<< HEAD
 * Provides P2P network connectivity for gossip protocol.
 */

=======
 * Provides P2P network connectivity for gossip protocol using HyperToken's
 * HybridPeerManager for WebSocket + WebRTC P2P networking with automatic upgrade.
 */

import { HybridPeerManager } from '../vendor/hypertoken/HybridPeerManager.js';
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
import type { PeerConnection, GossipMessage } from '../types.js';

export interface HyperTokenAdapterConfig {
  readonly relayUrl?: string;
<<<<<<< HEAD
  readonly peerId?: string;
}

/**
 * Mock peer connection for testing
 *
 * In production, this would use HyperToken's PeerConnection
 * or WebSocket-based P2P networking.
 */
export class MockPeerConnection implements PeerConnection {
  readonly id: string;
  private connected: boolean = true;
  private messageHandler?: (data: GossipMessage) => void;

  constructor(id: string) {
    this.id = id;
  }

  async send(data: GossipMessage): Promise<void> {
    if (!this.connected) {
      throw new Error(`Peer ${this.id} is not connected`);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));

    // In production, this would send over WebSocket/WebRTC
    // For now, just log
    console.log(`[MockPeer ${this.id}] Sent:`, data.type);
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    this.connected = false;
  }

  reconnect(): void {
    this.connected = true;
  }

  onMessage(handler: (data: GossipMessage) => void): void {
    this.messageHandler = handler;
  }

  simulateReceive(data: GossipMessage): void {
=======
}

/**
 * Wrapper that adapts HyperToken's event-driven HybridPeerManager
 * to Scarcity's PeerConnection interface
 */
class HyperTokenPeerWrapper implements PeerConnection {
  readonly id: string;
  private htManager: HybridPeerManager;
  private messageHandler?: (data: GossipMessage) => void;
  private targetPeerId: string;

  constructor(htManager: HybridPeerManager, targetPeerId: string) {
    this.htManager = htManager;
    this.targetPeerId = targetPeerId;
    this.id = targetPeerId;
  }

  async send(data: GossipMessage): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(`Peer ${this.id} is not connected`);
    }

    // Send message to specific peer using HyperToken's sendToPeer
    // This will use WebRTC if available, otherwise falls back to WebSocket
    this.htManager.sendToPeer(this.targetPeerId, data);
  }

  isConnected(): boolean {
    const wsConnection = this.htManager.getWebSocketConnection();
    return wsConnection.connected && wsConnection.peers.has(this.targetPeerId);
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
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
    if (this.messageHandler) {
      this.messageHandler(data);
    }
  }
}

/**
 * Adapter for HyperToken P2P networking
 *
<<<<<<< HEAD
 * In production, this would integrate with HyperToken's
 * Engine and PeerConnection classes for distributed state sync.
 */
export class HyperTokenAdapter {
  private readonly relayUrl: string;
  private readonly peerId: string;
  private readonly peers = new Map<string, MockPeerConnection>();

  constructor(config: HyperTokenAdapterConfig = {}) {
    this.relayUrl = config.relayUrl ?? 'ws://localhost:8080';
    this.peerId = config.peerId ?? this.generatePeerId();
=======
 * Provides hybrid WebSocket + WebRTC P2P connectivity through a relay server.
 * Automatically upgrades connections to WebRTC for lower latency when possible,
 * with graceful fallback to WebSocket.
 * Each HyperTokenAdapter instance represents a single peer in the gossip network.
 */
export class HyperTokenAdapter {
  private readonly relayUrl: string;
  private htManager: HybridPeerManager | null = null;
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
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
  }

  /**
   * Connect to relay server
<<<<<<< HEAD
   *
   * In production: Uses HyperToken Engine
   * Mock: Creates local peer simulation
   */
  async connect(): Promise<void> {
    // TODO: Integrate with actual HyperToken
    // const engine = new Engine();
    // await engine.connect(this.relayUrl);

    console.log(`[HyperToken] Connected to relay: ${this.relayUrl}`);
  }

  /**
   * Create peer connection
   */
  createPeer(peerId?: string): PeerConnection {
    const id = peerId ?? this.generatePeerId();
    const peer = new MockPeerConnection(id);
    this.peers.set(id, peer);
    return peer;
  }

  /**
   * Get all connected peers
   */
  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
=======
   */
  async connect(): Promise<void> {
    this.htManager = new HybridPeerManager({
      url: this.relayUrl,
      autoUpgrade: true,  // Automatically upgrade to WebRTC
      upgradeDelay: 1000  // Wait 1s after peer joins before upgrading
    });

    // Set up event handlers
    this.htManager.on('net:ready', (evt: any) => {
      this.isReady = true;
      console.log(`[HyperToken] Connected with peer ID: ${evt.payload.peerId}`);
      if (this.readyResolve) {
        this.readyResolve();
      }
    });

    this.htManager.on('net:peer:connected', (evt: any) => {
      const peerId = evt.payload.peerId;
      console.log(`[HyperToken] Peer joined: ${peerId}`);
    });

    this.htManager.on('net:peer:disconnected', (evt: any) => {
      const peerId = evt.payload.peerId;
      console.log(`[HyperToken] Peer left: ${peerId}`);
      this.peerWrappers.delete(peerId);
    });

    this.htManager.on('net:message', (evt: any) => {
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

    this.htManager.on('net:error', (evt: any) => {
      const error = evt.payload?.error || new Error('Unknown network error');
      console.error(`[HyperToken] Network error:`, error);
      if (this.readyReject && !this.isReady) {
        this.readyReject(error);
      }
    });

    // Optional: Listen to WebRTC upgrade events for visibility
    this.htManager.on('rtc:upgraded', (evt: any) => {
      const { peerId, usingTurn } = evt.payload;
      const turnInfo = usingTurn ? ' (via TURN)' : '';
      console.log(`[HyperToken] ✅ WebRTC connection established with ${peerId}${turnInfo}`);
    });

    this.htManager.on('rtc:downgraded', (evt: any) => {
      const { peerId } = evt.payload;
      console.log(`[HyperToken] WebRTC connection lost with ${peerId}, using WebSocket fallback`);
    });

    // Initiate connection
    this.htManager.connect();

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
    if (!this.htManager) {
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
    const wrapper = new HyperTokenPeerWrapper(this.htManager, targetPeerId);
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
    return this.htManager?.getPeerId() ?? null;
  }

  /**
   * Get list of actually connected peer IDs from relay server
   */
  getConnectedPeerIds(): string[] {
    if (!this.htManager) return [];
    const wsConnection = this.htManager.getWebSocketConnection();
    return wsConnection.peers ? Array.from(wsConnection.peers) : [];
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
  }

  /**
   * Disconnect from network
   */
  disconnect(): void {
<<<<<<< HEAD
    for (const peer of this.peers.values()) {
      peer.disconnect();
=======
    if (this.htManager) {
      this.htManager.disconnect();
      this.peerWrappers.clear();
      this.isReady = false;
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
    }
  }

  private generatePeerId(): string {
    return `peer-${Math.random().toString(36).substring(2, 11)}`;
  }
}
