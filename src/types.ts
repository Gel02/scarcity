/**
 * Core type definitions for Scarcity protocol
 */

export interface PublicKey {
  readonly bytes: Uint8Array;
}

export interface PrivateKey {
  readonly bytes: Uint8Array;
}

export interface KeyPair {
  readonly publicKey: PublicKey;
  readonly privateKey: PrivateKey;
}

export interface Attestation {
  readonly hash: string;
  readonly timestamp: number;
  readonly signatures: string[];
  readonly witnessIds: string[];
  readonly raw?: any;  // Original SignedAttestation from Witness for verification
}

export interface TransferPackage {
  readonly tokenId: string;
  readonly amount: number;
  readonly commitment: Uint8Array;
  readonly nullifier: Uint8Array;
  readonly proof: Attestation;
  readonly ownershipProof?: Uint8Array;
}

export interface PeerConnection {
  readonly id: string;
  send(data: GossipMessage): Promise<void>;
  isConnected(): boolean;
}

export interface GossipMessage {
  readonly type: 'nullifier' | 'ping' | 'pong';
  readonly nullifier?: Uint8Array;
  readonly proof?: Attestation;
  readonly timestamp: number;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly confidence: number;
  readonly reason?: string;
}

export interface ConfidenceParams {
  readonly gossipPeers: number;
  readonly witnessDepth: number;
  readonly waitTime: number;
}

// Integration interfaces for external services

export interface FreebirdClient {
  blind(publicKey: PublicKey): Promise<Uint8Array>;
  issueToken(blindedValue: Uint8Array): Promise<Uint8Array>;
  verifyToken(token: Uint8Array): Promise<boolean>;
  createOwnershipProof(secret: Uint8Array): Promise<Uint8Array>;
}

export interface WitnessClient {
  timestamp(hash: string): Promise<Attestation>;
  verify(attestation: Attestation): Promise<boolean>;
  checkNullifier(nullifier: Uint8Array): Promise<number>;
}

export interface GossipNetwork {
  publish(nullifier: Uint8Array, proof: Attestation): Promise<void>;
  checkNullifier(nullifier: Uint8Array): Promise<number>;
  setReceiveHandler(handler: (data: GossipMessage) => Promise<void>): void;
  readonly peers: PeerConnection[];
}

// Tor/Privacy configuration

export interface TorConfig {
  /** SOCKS5 proxy host (default: localhost) */
  readonly proxyHost?: string;
  /** SOCKS5 proxy port (default: 9050 for Tor) */
  readonly proxyPort?: number;
  /** Force all connections through Tor (default: false, only .onion) */
  readonly forceProxy?: boolean;
}
