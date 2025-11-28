/**
 * Scarcity: Privacy-preserving P2P value transfer protocol
 *
 * A gossip-based cryptocurrency with double-spend prevention
 * through distributed nullifier sets and threshold timestamping.
 *
 * @module scarce
 */

export { ScarbuckToken } from './token.js';
export { NullifierGossip } from './gossip.js';
export { TransferValidator } from './validator.js';
export { Crypto } from './crypto.js';

export { FreebirdAdapter } from './integrations/freebird.js';
export { WitnessAdapter } from './integrations/witness.js';
export { HyperTokenAdapter } from './integrations/hypertoken.js';

export type {
  PublicKey,
  PrivateKey,
  KeyPair,
  Attestation,
  TransferPackage,
  PeerConnection,
  GossipMessage,
  ValidationResult,
  ConfidenceParams,
  FreebirdClient,
  WitnessClient,
  GossipNetwork
} from './types.js';

export type { ScarbuckTokenConfig } from './token.js';
export type { ValidatorConfig } from './validator.js';
export type { GossipConfig } from './gossip.js';
export type { FreebirdAdapterConfig } from './integrations/freebird.js';
export type { WitnessAdapterConfig } from './integrations/witness.js';
export type { HyperTokenAdapterConfig } from './integrations/hypertoken.js';
