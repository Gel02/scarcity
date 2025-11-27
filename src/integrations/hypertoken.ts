/**
 * HyperToken integration adapter
 *
 * Provides P2P network connectivity for gossip protocol.
 */

import type { PeerConnection, GossipMessage } from '../types.js';

export interface HyperTokenAdapterConfig {
  readonly relayUrl?: string;
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
    if (this.messageHandler) {
      this.messageHandler(data);
    }
  }
}

/**
 * Adapter for HyperToken P2P networking
 *
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
  }

  /**
   * Connect to relay server
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
  }

  /**
   * Disconnect from network
   */
  disconnect(): void {
    for (const peer of this.peers.values()) {
      peer.disconnect();
    }
  }

  private generatePeerId(): string {
    return `peer-${Math.random().toString(36).substring(2, 11)}`;
  }
}
