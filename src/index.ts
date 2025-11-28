/**
<<<<<<< HEAD
 * Scarce: Privacy-preserving P2P value transfer protocol
=======
 * Scarcity: Privacy-preserving P2P value transfer protocol
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
 *
 * A gossip-based cryptocurrency with double-spend prevention
 * through distributed nullifier sets and threshold timestamping.
 *
 * @module scarce
 */

<<<<<<< HEAD
export { ScarceToken } from './token.js';
=======
export { ScarbuckToken } from './token.js';
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
export { NullifierGossip } from './gossip.js';
export { TransferValidator } from './validator.js';
export { Crypto } from './crypto.js';

export { FreebirdAdapter } from './integrations/freebird.js';
export { WitnessAdapter } from './integrations/witness.js';
<<<<<<< HEAD
export { HyperTokenAdapter, MockPeerConnection } from './integrations/hypertoken.js';
=======
export { HyperTokenAdapter } from './integrations/hypertoken.js';
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50

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

<<<<<<< HEAD
export type { ScarceTokenConfig } from './token.js';
=======
export type { ScarbuckTokenConfig } from './token.js';
>>>>>>> e2fb2463deafb1755ff5660830dd6e6a849cbb50
export type { ValidatorConfig } from './validator.js';
export type { GossipConfig } from './gossip.js';
export type { FreebirdAdapterConfig } from './integrations/freebird.js';
export type { WitnessAdapterConfig } from './integrations/witness.js';
export type { HyperTokenAdapterConfig } from './integrations/hypertoken.js';
