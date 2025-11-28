# Security Model: Nullifier Spam Mitigation

## Vulnerability Overview

**Attack Vector**: Generating random 32-byte strings (fake nullifiers) is computationally free, but storing them in RAM (`seenNullifiers`) costs resources. An attacker could flood the gossip network with invalid nullifiers to exhaust validator memory and CPU resources, causing denial of service.

**Impact**:
- Memory exhaustion (unbounded `seenNullifiers` map growth)
- CPU exhaustion (expensive Witness proof verification for spam)
- Network degradation (bandwidth consumed by invalid messages)

## Defense-in-Depth Strategy

Scarcity implements a **three-layer defense** against nullifier spam attacks, moving from the network layer up to the economic layer:

### Layer 1: HyperToken (Network Layer)

**Peer Reputation & Throttling** - First line of defense at the P2P connection layer.

#### 1.1 Peer Reputation Scoring

Located in: `src/gossip.ts`

Each peer is assigned a reputation score that tracks their behavior:

- **Starting score**: 0
- **Invalid Witness proof**: -10 points (heavy penalty)
- **Duplicate spam**: -1 point per duplicate
- **Expired nullifiers**: -2 points
- **Future timestamps**: -5 points
- **Valid messages**: +1 point (capped at 100)

When a peer's score drops below the threshold (default: -50), they are **automatically disconnected**.

```typescript
// Configuration
const gossip = new NullifierGossip({
  witness,
  peerScoreThreshold: -50,  // Disconnect threshold
  // ... other options
});

// Monitor peer reputation
const peerStats = gossip.getPeerStats(peerId);
console.log(peerStats); // { score, invalidProofs, duplicates, validMessages }
```

**Benefits**:
- Prevents malicious peers from continuously flooding the network
- Low-cost rejection of known bad actors
- Incentivizes honest behavior

#### 1.2 Rate Limiting (Leaky Bucket)

Located in: `src/integrations/hypertoken.ts`

Each peer connection has an independent **leaky bucket** rate limiter:

- **Default rate**: 10 messages/second per peer
- **Burst capacity**: 20 messages
- **Behavior**: Silently drops messages exceeding the limit

```typescript
const adapter = new HyperTokenAdapter({
  relayUrl: 'ws://localhost:8080',
  rateLimitPerSecond: 10,  // Refill rate
  rateLimitBurst: 20       // Bucket capacity
});

// Monitor rate limiting
const peer = adapter.createPeer(peerId);
const stats = peer.getRateLimitStats();
console.log(stats); // { droppedMessages, currentTokens }
```

**Benefits**:
- Prevents single malicious node from overwhelming CPU
- Graceful degradation under load
- No configuration required for honest peers

**How it works**:
1. Each peer starts with a full bucket (20 tokens)
2. Each message consumes 1 token
3. Tokens refill at 10/second
4. Messages received when bucket is empty are dropped

---

### Layer 2: Witness (Validation Layer)

**Proof-of-Work & Timestamp Validation** - Computational "tolls" and strict timestamp windows.

#### 2.1 Client Proof-of-Work Puzzles

Located in: `src/integrations/witness.ts`, `src/crypto.ts`

Before the Witness timestamps a nullifier, the client must solve a **computational puzzle**:

- Find a nonce such that `Hash(nullifier + nonce)` has N leading zero bits
- **Default difficulty**: 0 (disabled, for backward compatibility)
- **Recommended**: 16 bits = ~65,000 attempts (~50-200ms on modern hardware)
- **High security**: 20 bits = ~1,000,000 attempts (~5-10 seconds)

```typescript
const witness = new WitnessAdapter({
  gatewayUrl: 'https://witness.example.com',
  powDifficulty: 16  // 16 leading zero bits
});

// When you call timestamp(), it automatically solves the PoW
const proof = await witness.timestamp(nullifierHash);
// Output: [Witness] PoW solved in 87ms (difficulty: 16, nonce: 54321)
```

**Benefits**:
- Imposes computation cost on spammer (generating 1M fake nullifiers becomes expensive)
- Legitimate users barely notice the delay (< 100ms typical)
- Tunable difficulty based on threat level

**Implementation**: Uses SHA-256 mining algorithm similar to Bitcoin, but with much lower difficulty.

#### 2.2 Strict Timestamp Windows

Located in: `src/gossip.ts`

The gossip layer enforces **strict acceptance windows** for Witness timestamps:

- **Future timestamps**: Reject if > 5 seconds in the future (prevents pre-mining spam)
- **Old timestamps**: Reject if older than `maxNullifierAge` (default: ~1.5 years)
- **Early rejection**: Invalid timestamps are rejected **before** verifying the expensive Witness signature

```typescript
const gossip = new NullifierGossip({
  witness,
  maxTimestampFuture: 5,        // Max 5 seconds in future
  maxNullifierAge: 86400000     // Max age: 24 hours
});
```

**Benefits**:
- Saves CPU by rejecting obviously invalid nullifiers early
- Prevents attackers from pre-generating spam with future timestamps
- Prevents replay attacks with old nullifiers

---

### Layer 3: Freebird (Economic Layer)

**Sybil Resistance** - The root solution that makes spam economically infeasible.

#### 3.1 Token-Based Nullifier Generation

A valid nullifier is derived from a **valid Token ID and Secret**:

```
nullifier = Hash(secret || tokenId || timestamp)
```

To generate a valid nullifier that passes Witness verification, an attacker needs:
1. A valid token from Freebird (requires passing Sybil resistance)
2. Knowledge of the token's secret (obtained via VOPRF)

**Benefits**:
- Attacker cannot easily get 1 million tokens from Freebird
- Rate limiting or invitation-only issuance on Freebird server prevents mass token acquisition
- Economic cost scales linearly with spam volume

#### 3.2 Ownership Proof Verification (Optional)

Located in: `src/gossip.ts`

For **maximum spam resistance**, you can require every nullifier message to include a **Freebird Ownership Proof**:

```typescript
const gossip = new NullifierGossip({
  witness,
  requireOwnershipProof: true  // Enforce ownership proofs
});
```

**How it works**:
- Each gossip message must include `ownershipProof` (cryptographic proof of token ownership)
- Attacker must perform expensive VOPRF operation for each spam message
- Significantly slower than just generating random hashes

**Benefits**:
- Forces attacker to use valid Freebird tokens for spam
- Makes spam **as expensive as legitimate transfers**
- Reduces spam to economic denial-of-service (which is rate-limited by Freebird)

**Trade-off**: Increases bandwidth and verification overhead for all messages. Recommended only for high-security deployments.

---

## Configuration Examples

### Minimal Protection (Low-threat environments)

```typescript
// Basic rate limiting only
const gossip = new NullifierGossip({
  witness: new WitnessAdapter({ gatewayUrl: '...' }),
  peerScoreThreshold: -50
});

const adapter = new HyperTokenAdapter({
  rateLimitPerSecond: 10,
  rateLimitBurst: 20
});
```

### Balanced Protection (Recommended)

```typescript
// All layers except ownership proofs
const gossip = new NullifierGossip({
  witness: new WitnessAdapter({
    gatewayUrl: '...',
    powDifficulty: 16  // ~65k attempts
  }),
  peerScoreThreshold: -50,
  maxTimestampFuture: 5,
  maxNullifierAge: 86400000  // 24 hours
});

const adapter = new HyperTokenAdapter({
  rateLimitPerSecond: 10,
  rateLimitBurst: 20
});
```

### Maximum Protection (High-security deployments)

```typescript
// All layers including ownership proofs
const gossip = new NullifierGossip({
  witness: new WitnessAdapter({
    gatewayUrl: '...',
    powDifficulty: 20  // ~1M attempts, ~5-10 seconds
  }),
  peerScoreThreshold: -30,      // Stricter threshold
  maxTimestampFuture: 2,        // Tighter window
  maxNullifierAge: 3600000,     // 1 hour max age
  requireOwnershipProof: true   // Mandatory ownership proofs
});

const adapter = new HyperTokenAdapter({
  rateLimitPerSecond: 5,   // Lower rate limit
  rateLimitBurst: 10       // Lower burst
});
```

---

## Attack Cost Analysis

### Without Mitigations
- **Cost to generate 1M fake nullifiers**: ~0 (just random bytes)
- **Validator impact**: Memory exhaustion, crash

### With Layer 1 (Network)
- **Cost**: Attacker needs to create multiple peer identities
- **Limit**: 10 msg/sec/peer × N peers
- **Result**: Significantly slows attack, but still possible with Sybil network

### With Layer 1 + 2 (Network + Validation)
- **Cost**: 1M nullifiers × 50ms PoW = ~14 hours of computation
- **Limit**: Rate limiting + computational cost
- **Result**: Attack becomes expensive and slow

### With All Layers (Network + Validation + Economic)
- **Cost**: Attacker needs 1M valid Freebird tokens + PoW computation
- **Limit**: Freebird Sybil resistance limits token acquisition
- **Result**: Attack becomes economically infeasible

---

## Monitoring & Metrics

### Track peer reputation:
```typescript
const allScores = gossip.getAllPeerScores();
for (const [peerId, score] of allScores) {
  console.log(`${peerId}: ${score.score} (invalid: ${score.invalidProofs}, dupes: ${score.duplicates})`);
}
```

### Monitor rate limiting:
```typescript
for (const peer of adapter.getPeers()) {
  const stats = peer.getRateLimitStats();
  console.log(`${peer.id}: dropped ${stats.droppedMessages}, tokens: ${stats.currentTokens}`);
}
```

### Track gossip health:
```typescript
const stats = gossip.getStats();
console.log(`Nullifiers: ${stats.nullifierCount}, Peers: ${stats.peerCount}, Active: ${stats.activePeers}`);
```

---

## Future Enhancements

1. **Adaptive PoW Difficulty**: Automatically increase difficulty during attack
2. **Peer Reputation Persistence**: Save scores across restarts
3. **Distributed Banlist**: Share malicious peer IDs across network
4. **Freebird Rate Limiting Integration**: Query Freebird for token issuance rate
5. **Machine Learning**: Detect spam patterns using ML

---

## References

- **Leaky Bucket Algorithm**: https://en.wikipedia.org/wiki/Leaky_bucket
- **Proof-of-Work**: https://en.wikipedia.org/wiki/Proof_of_work
- **Sybil Resistance**: Freebird whitepaper (see `README.md`)
- **P2P Reputation Systems**: https://dl.acm.org/doi/10.1145/1030194.1015504

---

## Security Contact

To report security vulnerabilities in Scarcity, please open an issue at:
https://github.com/flammafex/scarcity/issues

**Do not** disclose security vulnerabilities publicly until they have been addressed.
