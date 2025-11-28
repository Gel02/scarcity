<div align=center><img src="scarcity.webp"></div>
<div align=center><img src="church.png" width=72 height=72>

_A mission of [The Carpocratian Church of Commonality and Equality](https://carpocratian.org/en/church/)_</div>

<div align=center><img src="mission.png" width=256 height=200></div>


# SAY 'HELLO, WORLD' TO MY LITTLE FRIEND

Scarcity is a zero-cost, serverless cryptocurrency that achieves double-spend prevention without blockchains, mining, or global ledgers. It combines gossip-based nullifier sets with threshold timestamping to create a truly decentralized value transfer protocol.

---

## Rationale

Traditional cryptocurrencies require one of three sacrifices:

1. **Centralization** (trusted servers)
2. **Cost** (gas fees, mining rewards, staking)
3. **Publicity** (transparent ledgers, wallet addresses)

Scarcity refuses all three. It's designed from first principles with these constraints:

- **Privacy-Preserving**: With Freebird, sender/receiver unlinkable
- **Serverless**: With HyperToken, P2P without catastrophic infrastructure
- **Provable**: With Witness, cryptographically verifiable
- **Zero-Cost**: No gas fees, no mining, no staking
- **Anonymous**: No wallet addresses, no on-chain history

---

## How It Works

### The Double-Spend Problem

Every cryptocurrency must prevent the same token from being spent twice. The traditional solution is a **global ledger** (blockchain) that everyone agrees on. But this requires:

- Mining/staking (cost)
- Public transaction history (no privacy)
- Consensus mechanisms (complexity)

### The Scarcity Solution

Instead of a global ledger, Scarcity uses:

1. **Nullifier Sets** - Unique "spent" markers gossipped P2P
2. **Witness Timestamping** - Ground truth for disputes
3. **Probabilistic Acceptance** - You don't need 100% certainty instantly

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  ScarceToken: Value transfer primitive          │
│  • Freebird: Anonymous ownership proofs         │
│  • Nullifiers: Unique spend identifiers         │
│  • Transfer packages with commitments           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  NullifierGossip: Fast propagation              │
│  • P2P broadcast of spent nullifiers            │
│  • Local nullifier sets per peer                │
│  • Epidemic-style forwarding                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  TransferValidator: Acceptance logic            │
│  • Gossip check (fast, probabilistic)           │
│  • Witness check (slow, deterministic)          │
│  • Confidence scoring (tunable risk)            │
└─────────────────────────────────────────────────┘
```

---

## Protocol Flow

### Minting

```typescript
const token = ScarceToken.mint(100, freebird, witness, gossip);
```

Creates a new token with:
- Random token ID
- Secret ownership key
- Amount (arbitrary units)

### Transfer

```typescript
const pkg = await token.transfer(recipientPublicKey);
```

1. **Generate nullifier**: `H(secret || tokenId || timestamp)`
2. **Blind recipient**: Use Freebird VOPRF to hide recipient identity
3. **Create ownership proof**: Prove you can spend without revealing secret
4. **Timestamp**: Get Witness attestation for ordering
5. **Broadcast**: Gossip nullifier to all peers

### Receive

```typescript
const newToken = await ScarceToken.receive(
  pkg,
  recipientSecret,
  freebird,
  witness,
  gossip
);
```

1. **Verify proof**: Check Witness attestation is valid
2. **Validate ownership**: Check sender's authorization
3. **Create new token**: Generate new secret for recipient

### Validation

```typescript
const result = await validator.validateTransfer(pkg);
```

**Fast Path (instant):**
- Check gossip network for nullifier
- Reject if seen (double-spend)

**Witness Path (deterministic):**
- Query Witness federation
- Reject if proven double-spend

**Wait Period (tunable):**
- Allow gossip propagation (default: 5 seconds)
- Check again after waiting

**Confidence Scoring:**
```
confidence = peerScore + witnessScore + timeScore
           = (peers/10) + (depth/3) + (wait/10s)
           = up to 0.5  + up to 0.3 + up to 0.2
           = max 1.0 (perfect certainty)
```

---

## Privacy Guarantees

### Unlinkability

**Freebird Integration:**
- Recipient commitments use VOPRF blinding
- Issuer cannot correlate issuance with redemption
- Verifier cannot link transfers to identities

**No Addresses:**
- No wallet addresses on-chain
- No transaction graph to analyze
- No cluster analysis possible

### Anonymity

**Bearer Tokens:**
- Possession = ownership
- No identity required to hold
- No KYC/AML by design

**Gossip Privacy:**
- Nullifiers are random bytes
- No correlation to sender/receiver
- Network-level privacy via Tor/mixnets

---

## Security Model

### Threat Model

**Protected Against:**
- Double-spending (via nullifier sets + Witness)
- Forgery (via Freebird's unforgeable tokens)
- Replay attacks (nullifiers are single-use)
- Network partitions (gossip + eventual consistency)

**Not Protected Against:**
- Token theft (secure your secrets!)
- Sybil attacks on gossip network (use Tor)
- Quantum adversaries (ECDLP-based)
- Legal seizure (cash-like bearer instrument)

### Trust Assumptions

**Gossip Network:**
- Assumes at least some honest peers
- More peers = higher confidence
- Can operate with zero peers (degrade to Witness-only)

**Witness Federation:**
- Threshold assumption (< T witnesses collude)
- Recommended: 3-of-5 or 5-of-7
- Cross-network anchoring for hardening

**Freebird:**
- Issuer and verifier must be separate (timing attacks)
- Discrete log problem hardness (P-256)

---

## Integration with Privacy Stack

### Freebird: Anonymous Authorization

```typescript
const freebird = new FreebirdAdapter({
  issuerUrl: 'https://issuer.example.com',
  verifierUrl: 'https://verifier.example.com'
});

// Blind recipient public key using P-256 VOPRF
const commitment = await freebird.blind(recipientKey);

// Issue anonymous token with DLEQ proof verification
const token = await freebird.issueToken(commitment);

// Create unforgeable ownership proof
const proof = await freebird.createOwnershipProof(secret);
```

**P-256 VOPRF (Verifiable Oblivious Pseudorandom Function):**
- Production-ready cryptographic blinding with DLEQ proofs
- Anonymous token issuance without revealing identity
- Verifiable: DLEQ proof ensures issuer used correct secret key
- Oblivious: Issuer cannot link token issuance to redemption
- Based on RFC 9497 and hash-to-curve (RFC 9380)

### Witness: Timestamped Attestations

```typescript
const witness = new WitnessAdapter({
  gatewayUrl: 'https://witness.example.com',
  networkId: 'scarce-mainnet'
});

// Timestamp transfer package
const attestation = await witness.timestamp(packageHash);

// Verify attestation (supports both Ed25519 and BLS12-381 signatures)
const valid = await witness.verify(attestation);
```

**BLS Signature Aggregation:**
- Supports BLS12-381 aggregated signatures (50% bandwidth savings)
- 3 witnesses: 96 bytes (BLS) vs 192 bytes (Ed25519)
- Local verification with `@noble/curves` library
- Automatic fallback to gateway verification
- Compatible with Witness federation modes

### HyperToken: P2P Networking

```typescript
const hypertoken = new HyperTokenAdapter({
  relayUrl: 'ws://relay.example.com:8080'
});

await hypertoken.connect();

// Create peer connections for gossip
// Connections automatically upgrade from WebSocket to WebRTC for lower latency
const peers = [
  hypertoken.createPeer(),
  hypertoken.createPeer(),
  hypertoken.createPeer()
];

gossip.addPeer(peers[0]);
```

**Hybrid Architecture (WebSocket + WebRTC):**
- Starts with WebSocket relay for initial connection and signaling
- Automatically upgrades to WebRTC DataChannel for direct P2P (lower latency)
- Falls back to WebSocket gracefully if WebRTC fails (NAT traversal issues)
- TURN relay support for restrictive network environments
- Transparent to the gossip protocol - same API for both transports

### Tor: Onion Service Support

**Privacy-Enhanced Connectivity:**

Scarcity supports Tor hidden services (.onion addresses) for maximum privacy and censorship resistance. All HTTP/HTTPS integrations (Freebird, Witness) automatically route through Tor's SOCKS5 proxy when connecting to .onion addresses.

```typescript
import { FreebirdAdapter, WitnessAdapter, configureTor } from 'scarce';

// Option 1: Global Tor configuration
configureTor({
  proxyHost: 'localhost',
  proxyPort: 9050,          // Default Tor SOCKS port
  forceProxy: false         // Only use Tor for .onion addresses
});

// Option 2: Per-adapter configuration
const freebird = new FreebirdAdapter({
  issuerUrl: 'http://yourissuer123456.onion',
  verifierUrl: 'http://yourverifier789.onion',
  tor: {
    proxyHost: 'localhost',
    proxyPort: 9050
  }
});

const witness = new WitnessAdapter({
  gatewayUrl: 'http://yourwitness456.onion',
  tor: {
    proxyHost: 'localhost',
    proxyPort: 9050
  }
});
```

**P-256 VOPRF (Verifiable Oblivious Pseudorandom Function):**
- Production-ready cryptographic blinding with DLEQ proofs
- Anonymous token issuance without revealing identity
- Verifiable: DLEQ proof ensures issuer used correct secret key
- Oblivious: Issuer cannot link token issuance to redemption
- Based on RFC 9497 and hash-to-curve (RFC 9380)

**Privacy Stack:**
- **IP Privacy**: Tor hides your IP address via 3-hop onion routing
- **Transaction Privacy**: Freebird VOPRF makes sender/receiver unlinkable
- **Network Privacy**: HyperToken P2P eliminates central servers
- **Temporal Privacy**: Witness timestamps provide ordering without revealing identity
- **Censorship Resistance**: .onion addresses cannot be blocked or taken down

**Setting up Tor:**
```bash
# Install Tor
sudo apt install tor          # Ubuntu/Debian
brew install tor              # macOS

# Start Tor service
sudo service tor start        # Ubuntu/Debian
brew services start tor       # macOS

# Check status
curl --socks5 localhost:9050 https://check.torproject.org/
```

**Running your own .onion services:**
1. Configure hidden service in `/etc/tor/torrc`:
   ```
   HiddenServiceDir /var/lib/tor/scarcity-issuer/
   HiddenServicePort 8081 127.0.0.1:8081
   ```
2. Restart Tor: `sudo service tor restart`
3. Get your .onion address: `cat /var/lib/tor/scarcity-issuer/hostname`
4. Use the `.onion` address in your Scarcity configuration

**Graceful Degradation:**
- Automatically falls back to clearnet if Tor is unavailable
- Warns when .onion address detected but Tor not configured
- No crashes or failures - always functional

---

## Usage Example

### Complete Transfer Flow

```typescript
import {
  ScarceToken,
  NullifierGossip,
  TransferValidator,
  FreebirdAdapter,
  WitnessAdapter,
  HyperTokenAdapter
} from 'scarce';

// Initialize infrastructure
const freebird = new FreebirdAdapter({
  issuerUrl: 'https://issuer.example.com',
  verifierUrl: 'https://verifier.example.com'
});

const witness = new WitnessAdapter({
  gatewayUrl: 'https://witness.example.com'
});

const hypertoken = new HyperTokenAdapter({
  relayUrl: 'ws://relay.example.com:8080'
});

await hypertoken.connect();

// Create gossip network
const gossip = new NullifierGossip({ witness });

// Add peers
const peers = [
  hypertoken.createPeer(),
  hypertoken.createPeer(),
  hypertoken.createPeer()
];

peers.forEach(peer => gossip.addPeer(peer));

// Create validator
const validator = new TransferValidator({
  gossip,
  witness,
  waitTime: 5000,      // 5 second wait
  minConfidence: 0.7   // 70% confidence required
});

// Mint a token
const token = ScarceToken.mint(100, freebird, witness, gossip);

// Transfer to recipient
const recipientKey = { bytes: new Uint8Array(32) }; // recipient's public key
const transferPkg = await token.transfer(recipientKey);

// Recipient validates
const result = await validator.validateTransfer(transferPkg);

if (result.valid) {
  console.log(`Transfer accepted with ${(result.confidence * 100).toFixed(0)}% confidence`);

  // Receive the token
  const recipientSecret = new Uint8Array(32); // recipient's secret
  const receivedToken = await ScarceToken.receive(
    transferPkg,
    recipientSecret,
    freebird,
    witness,
    gossip
  );

  console.log('Token received!', receivedToken.getMetadata());
} else {
  console.error(`Transfer rejected: ${result.reason}`);
}
```

### Tuning Confidence

```typescript
// Fast validation (instant, lower confidence)
const fastResult = await validator.fastValidate(transferPkg);

// Deep validation (30s wait, maximum confidence)
const deepResult = await validator.deepValidate(transferPkg, 30_000);

// Custom confidence threshold
validator.setMinConfidence(0.9); // Require 90% confidence
```

---

## Performance Characteristics

### Latency

- **Fast path**: ~10-50ms (gossip check only)
- **Standard**: 5 seconds (default wait time)
- **Deep validation**: 30+ seconds (high-value transfers)

### Throughput

- **Gossip broadcast**: O(peers) per transfer
- **Witness timestamping**: ~100-1000 TPS per federation
- **Validation**: Parallel, scales with peer count

### Storage

- **Per-peer nullifier set**: ~10KB per 1000 transfers
- **Witness attestations**: ~500 bytes per transfer
- **Token secrets**: 32 bytes per token

---

## Comparison to Alternatives

| Feature | Scarcity | Bitcoin | Zcash | Lightning | Monero |
|---------|--------|---------|-------|-----------|--------|
| No blockchain | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| No gas fees | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| No addresses | ✅ | ❌ | ⚠️ | ❌ | ⚠️ |
| Sender/receiver unlinkable | ✅ | ❌ | ✅ | ❌ | ✅ |
| No global state | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| Serverless | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quantum-resistant | ❌ | ❌ | ❌ | ❌ | ❌ |

⚠️ = Partially/conditional

---

## Deployment

### Development

```bash
npm install
npm run build
npm test
```

### Running Integration Tests

**Prerequisites:**
The integration tests require the following services:

1. **HyperToken Relay Server**
   ```bash
   cd /path/to/hypertoken
   node start-relay.js
   ```
   Default: `ws://localhost:8080`

2. **Witness Gateway + Nodes**
   ```bash
   # See https://github.com/flammafex/witness
   ```
   Default: `http://localhost:8080`

3. **Freebird Issuer + Verifier**
   ```bash
   # See https://github.com/flammafex/freebird
   ```
   Default issuer: `http://localhost:8081`
   Default verifier: `http://localhost:8082`

**Run Tests:**
```bash
# Full integration test suite
npm test

# Individual test suites
npm run test:basic          # Basic token transfer
npm run test:double-spend   # Double-spend detection
npm run test:degradation    # Graceful degradation (works without services)
```

**Expected Results (with all services running):**
```
✅ Graceful Degradation: 100% pass (5/5 tests)
✅ Basic Token Transfer: 100% pass (9/9 tests)
✅ Double-Spend Detection: 100% pass (7/7 tests)

Total: 21/21 tests passing
Pass Rate: 100.0%
```

**Without Services:**
Tests gracefully degrade to fallback mode, demonstrating resilience:
```
✅ Graceful Degradation: 100% pass (5/5 tests)
⚠️  Basic Token Transfer: 88.9% pass (8/9 tests)
✅ Double-Spend Detection: 100% pass (7/7 tests)
```

### Production Considerations

**Gossip Network:**
- Run on Tor for network-level privacy
- Connect to multiple relay servers
- Bootstrap from trusted peers

**Witness Federation:**
- Deploy 3-5 independent witnesses
- Cross-network anchoring for hardening
- Regular key rotation

**Freebird:**
- Separate issuer/verifier infrastructure
- Rate limiting for Sybil resistance
- Hardware-backed keys (HSM)

---

## Limitations

### Not Suitable For

- **High-frequency trading**: Validation latency (seconds)
- **Large-scale retail**: Gossip overhead at scale
- **Regulated environments**: No KYC/AML compliance
- **Quantum future**: ECDLP-based cryptography

### Design Tradeoffs

- **Eventual consistency**: Not instant finality
- **Gossip overhead**: O(peers) bandwidth per transfer
- **Trust assumptions**: Witness federation threshold
- **No atomic swaps**: Cross-chain composability limited

---

## Roadmap

**Phase 1: Core Protocol** ✅ **COMPLETE**
- [x] Token minting and transfer
- [x] Nullifier gossip network
- [x] Probabilistic validation
- [x] Real HyperToken P2P networking (WebSocket relay)
- [x] Real Freebird HTTP client integration
- [x] Real Witness threshold timestamping
- [x] Comprehensive integration test suite (100% pass)

**Phase 2: Hardening** 🔨 ✅ **COMPLETE** (4/4 complete, 100%)
- [x] BLS signature aggregation (Witness) ✅ **COMPLETE**
- [x] WebRTC peer connections (HyperToken) ✅ **COMPLETE**
- [x] VOPRF production integration (Freebird) ✅ **COMPLETE**
- [x] Tor onion service support ✅ **COMPLETE**

**Phase 3: Advanced Features**
- [ ] Token splitting/merging
- [ ] Multi-party transfers
- [ ] Conditional payments (HTLCs)
- [ ] Cross-federation bridging

**Phase 4: Tooling**
- [ ] Web wallet interface
- [ ] Mobile SDK (React Native)
- [ ] CLI tools for scripting
- [ ] Block explorer (nullifier viewer)

---

## Architecture Details

### Nullifier Generation

```
nullifier = SHA-256(secret || tokenId || timestamp)
```

**Properties:**
- Unique per token + time
- Cannot be correlated to sender/receiver
- Single-use (timestamp prevents replay)
- Unpredictable (requires secret)

### Gossip Protocol

```
On receive(nullifier, proof):
  1. Verify Witness attestation
  2. Check if already seen
  3. Add to local set
  4. Forward to all peers (epidemic broadcast)
```

**Properties:**
- Eventually consistent
- Probabilistic guarantee (grows with time)
- Partition-tolerant
- Self-healing (re-gossip on reconnect)

### Confidence Scoring

```typescript
peerScore = min(peers / 10, 0.5)       // Up to 50%
witnessScore = min(depth / 3, 0.3)     // Up to 30%
timeScore = min(waitMs / 10_000, 0.2)  // Up to 20%

confidence = peerScore + witnessScore + timeScore  // Max: 1.0
```

**Tuning:**
- Small transfers: 0.5 confidence (instant)
- Medium transfers: 0.7 confidence (5s wait)
- Large transfers: 0.9+ confidence (30s+ wait)

---

## FAQ

**Q: Is this a blockchain?**
A: No. There's no global ledger, no mining, no consensus. Just gossip + timestamps.

**Q: How do you prevent double-spending?**
A: Nullifiers are broadcast P2P. If seen twice, reject. Witness provides ground truth.

**Q: What if the network partitions?**
A: Gossip heals on reconnect. Witness provides ordering for disputes.

**Q: Is this Chaumian e-cash?**
A: Similar, but serverless. Freebird provides the blinding, Witness replaces the bank.

**Q: Can I mine/stake for rewards?**
A: No. Scarcity is zero-cost by design. No incentives, no fees.

**Q: How are tokens created?**
A: Application-specific. Could be fiat-backed, work-based, time-based, etc.

**Q: Is this production-ready?**
A: Phase 1 is complete with working integrations. However, this is still a research prototype requiring Phase 2 hardening (BLS aggregation, WebRTC, production VOPRF) before production use.

---

## License

Apache License 2.0

---

## Related Projects

- **[Freebird](https://github.com/flammafex/freebird)**: Anonymous authorization infrastructure
- **[HyperToken](https://github.com/flammafex/hypertoken)**: Distributed state synchronization
- **[Witness](https://github.com/flammafex/witness)**: Threshold signature timestamping

**Scarcity: You're fucking with the best.**
