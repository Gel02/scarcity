<div align=center><img src="scarcity.webp"></div>
<div align=center><img src="scarbucks.webp" width=288></div>
&nbsp;
<div align=center style><img src="church.png" width=72 height=72></div>

<div align=center>A mission of <a href="https://carpocratian.org">The Carpocratian Church of Commonality and Equality</a></div>

<div align=center><img src="mission.png" width=256 height=200></div>
<div align=center><h1>Now featuring Nullscape Explorer <img src="nullscape.webp" width=72 height=72></h1></div>


# SAY 'HELLO, WORLD' TO MY LITTLE FRIEND

Scarcity is a zero-cost, serverless cryptocurrency that achieves double-spend prevention without blockchains, mining, or global ledgers. It combines gossip-based nullifier sets with threshold timestamping to create a truly decentralized value transfer protocol.

---

## Rationale

Traditional cryptocurrencies require one of three sacrifices:

1. **Centralization** (trusted servers)
2. **Cost** (gas fees, mining rewards, staking)
3. **Publicity** (transparent ledgers, wallet addresses)

Scarcity refuses all three. It's designed from first principles with these constraints:
 
- **Privacy-Preserving**: With **[Freebird](https://github.com/flammafex/freebird)**, sender/receiver unlinkable
- **Serverless**: With **[HyperToken](https://github.com/flammafex/hypertoken)**, P2P without catastrophic infrastructure
- **Provable**: With **[Witness](https://github.com/flammafex/witness)**, cryptographically verifiable
- **Zero-Cost & Zero-Waste**: No gas fees, no mining, no staking — and ~12 million times less energy than Bitcoin ([details](ENVIRONMENT.md))
- **Anonymous**: No wallet addresses, no on-chain history

- **[Freebird](https://github.com/flammafex/freebird)**: Anonymous authorization infrastructure
- **[HyperToken](https://github.com/flammafex/hypertoken)**: Distributed state synchronization
- **[Witness](https://github.com/flammafex/witness)**: Threshold signature timestamping

  Are you getting it?

---

## Environmental Impact

**Scarcity uses ~12 million times less energy per transaction than Bitcoin.**

Traditional cryptocurrencies require massive energy expenditure for mining (Bitcoin: ~150 TWh annually) or validator infrastructure (Ethereum: ~0.01 TWh annually). Scarcity eliminates this waste entirely through gossip-based double-spend prevention and threshold timestamping.

**Energy per transaction:**
- Bitcoin: ~1,200 kWh (could power a US home for 40+ days)
- Ethereum: ~0.02 kWh (comparable to a Google search)
- **Scarcity: ~0.0001 kWh (comparable to sending a message)**

No mining. No proof-of-work. No global ledger synchronization. Just cryptography and gossip.

📊 **[Read the full environmental impact analysis →](ENVIRONMENT.md)**

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

## Economic Model: Lazy Demurrage

Scarcity implements a novel economic primitive The Church calls **Lazy Demurrage**—a system where currency behaves less like immutable gold and more like metabolic energy.

By enforcing a **Rolling Validity Window** (default ~1.5 years), Scarcity creates a high-velocity economy that automatically prunes dead capital. This mechanism draws on three historical and biological precedents:

### 1. The Validity Cliff (Digital Escheatment)
Traditional demurrage charges a complex negative interest rate (e.g., -1% per month). Scarcity implements a computationally efficient **Validity Cliff**.

A token retains **100%** of its value for its entire validity window. However, if it is not transferred (refreshed) before the window expires, its value drops instantly to **0**. This acts as a decentralized form of **Escheatment**. Instead of a central bank seizing dormant accounts, the network itself reclaims the storage resources, and the token becomes unspendable static.

### 2. Metabolic Money (ATP)
Unlike Bitcoin, which treats coins as immutable rocks that can sit in a desert for a thousand years, Scarcity treats tokens like **ATP** in a biological cell. Money is potential energy that must be used or regenerated to persist.

This model effectively eliminates the "Lost Coin" problem. If keys are lost, the network does not carry the burden of that unspendable UTXO forever. The economy metabolizes its own history, ensuring the ledger size remains bounded $O(1)$ relative to time.

### 3. Gesellian "Rusting Money"
This architecture effectively digitizes the **Wörgl Experiment** (1932) and Silvio Gesell's concept of *Freigeld* ("Free Money"). Just as the citizens of Wörgl had to affix a stamp to their banknotes monthly to keep them valid, Scarcity users must cryptographically "refresh" their funds by moving them to a new secret. This structural disincentive to hoarding forces circulation and economic activity.

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  ScarbuckToken: Value transfer primitive          │
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
const token = ScarbuckToken.mint(100, freebird, witness, gossip);
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
const newToken = await ScarbuckToken.receive(
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
- Forgery (via Freebird's unforgeable VOPRF tokens)
- Replay attacks (nullifiers are single-use)
- Network partitions (gossip + eventual consistency)
- Sybil attacks on token issuance (via Freebird's pluggable Sybil resistance: invitation system, PoW, rate limiting, WebAuthn)

**Not Protected Against:**
- Token theft (secure your secrets! Use TLS for token transmission)
- Network-level correlation attacks (timing analysis by network observers - use Tor/mixnets)
- Quantum adversaries (ECDLP-based cryptography)
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
- Issuer and verifier must be separate (timing attack mitigation)
- Discrete log problem hardness (P-256)
- TLS required for token transmission (prevents bearer token theft)
- Sybil resistance configured at deployment (invitation/PoW/rate-limit/WebAuthn/combined)
- Rate limiting without user tracking (via anonymous token consumption + nullifier sets)

### Nullifier Spam Mitigation

Scarcity implements **defense-in-depth** against nullifier flooding attacks through three layers:

1. **Layer 1 (Network)**: Peer reputation scoring and rate limiting (leaky bucket)
2. **Layer 2 (Validation)**: Proof-of-work challenges and strict timestamp windows
3. **Layer 3 (Economic)**: Freebird Sybil resistance and ownership proof verification

For detailed information on the vulnerability, attack vectors, and mitigation strategies, see:

📖 **[SECURITY.md](SECURITY.md)** - Complete security documentation with configuration examples and attack cost analysis.

---

## 📋 System Requirements

### Required Software

**For Docker Setup (Recommended):**
- Docker Engine 20.10+ or Docker Desktop
- Docker Compose V2
- 2GB+ RAM available
- 1GB+ disk space

**For Local Development:**
- Node.js 20+ (LTS recommended)
- npm 9+ (comes with Node.js)
- Git
- 2GB+ RAM available
- 500MB+ disk space

**For Building from Source:**
- All Local Development requirements
- Python 3.x (for native module compilation)
- C++ compiler toolchain:
  - **Linux**: `build-essential` package (gcc, g++, make)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Visual Studio Build Tools or Windows Build Tools

### Supported Platforms

- ✅ **Linux** (Ubuntu 20.04+, Debian 11+, Fedora 35+, Arch)
- ✅ **macOS** (11+ Big Sur or newer)
- ✅ **Windows** (10/11 with WSL2 recommended for Docker)

### Network Requirements

- **Ports Used:**
  - `3000`: HyperToken Relay WebSocket (Docker) / Web Wallet UI (Local)
  - `3001`: Nullscape Explorer
  - `8080`: Witness Gateway HTTP (Docker)
  - `8081`: Freebird Issuer (Docker)
  - `8082`: Freebird Verifier (Docker)

**Note:** When running both Docker services and local Web Wallet, port 3000 will be used by HyperToken Relay. Run the Web Wallet on a different port: `PORT=3333 npm run web`

### Optional Dependencies

- **Tor** (for anonymous networking): `tor` package installed and running on port 9050
- **SQLite3** CLI tools (for manual database inspection)

---

## 🚀 First Time Setup Checklist

Follow these steps to get Scarcity running on your machine:

### Option 1: Docker Setup (5-10 minutes) ⭐ Recommended

- [ ] **Install Docker Desktop** or Docker Engine + Docker Compose
- [ ] **Clone the repository:**
  ```bash
  git clone https://github.com/flammafex/scarcity.git
  cd scarcity
  ```
- [ ] **Run the entire stack:**
  ```bash
  docker compose up --build --abort-on-container-exit
  ```
- [ ] **Verify success** - You should see test output ending with "All tests passed! ✓"
- [ ] **Try the CLI:**
  ```bash
  docker compose run --rm scarcity-tests ./dist/src/cli/index.js wallet list
  ```

**That's it!** Docker handles all dependencies, networking, and configuration automatically.

### Option 2: Local Development (30-60 minutes)

- [ ] **Install Node.js 20+** from [nodejs.org](https://nodejs.org/)
- [ ] **Verify installation:**
  ```bash
  node --version  # Should show v20.x.x or higher
  npm --version   # Should show 9.x.x or higher
  ```
- [ ] **Install build tools** (for native dependencies):
  - **Linux**: `sudo apt install build-essential` (Ubuntu/Debian) or equivalent
  - **macOS**: `xcode-select --install`
  - **Windows**: Install Visual Studio Build Tools
- [ ] **Clone the repository:**
  ```bash
  git clone https://github.com/flammafex/scarcity.git
  cd scarcity
  ```
- [ ] **Install dependencies:**
  ```bash
  npm install
  ```
  - ⚠️ If `better-sqlite3` fails to build, ensure you have C++ build tools installed
- [ ] **Build the project:**
  ```bash
  npm run build
  ```
- [ ] **Run tests (simulation mode):**
  ```bash
  npm test
  ```
  - Tests work WITHOUT external services in simulation mode
  - You should see "All tests passed! ✓"
- [ ] **Optional: Set up external services** (for full functionality):
  ```bash
  # Start infrastructure with Docker
  docker compose up -d freebird-issuer freebird-verifier witness-gateway hypertoken-relay

  # Or set up each service manually (advanced - see QUICKSTART.md)
  ```
- [ ] **Try the CLI:**
  ```bash
  ./dist/src/cli/index.js wallet create alice
  ./dist/src/cli/index.js wallet list
  ```
- [ ] **Optional: Install CLI globally:**
  ```bash
  npm install -g .
  scar wallet list
  ```

### Option 3: Web Wallet / Explorer (After completing Option 1 or 2)

- [ ] **Start the Web Wallet:**
  ```bash
  npm run web
  # Opens on http://localhost:3000
  ```
- [ ] **Start the Nullscape Explorer:**
  ```bash
  npm run explorer
  # Opens on http://localhost:3001
  ```

### Troubleshooting

If you encounter issues, see **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for common problems and solutions.

---

## ⚡ Quick Start (Docker)

Run the entire Scarcity ecosystem (Freebird, Witness, HyperToken) and integration tests with a single command. No manual setup required.

### 1. Run Everything
This command builds Scarcity, pulls the latest dependencies (Freebird/Witness), starts the p2p network, and runs the integration suite.

```bash
docker compose up --build --abort-on-container-exit
```

### 2. Interactive Development
To run the infrastructure in the background and execute CLI commands manually:

```bash
# Start infrastructure (Freebird, Witness, Relay) in background
docker compose up -d freebird-issuer freebird-verifier witness-gateway hypertoken-relay

# Run the CLI against the local docker network
docker compose run --rm scarcity-tests ./dist/src/cli/index.js wallet list
```

For detailed deployment scenarios, see [QUICKSTART.md](QUICKSTART.md).

---

## Integration with Privacy Stack

### Freebird: Anonymous Authorization

```typescript
// Single issuer (backward compatible)
const freebird = new FreebirdAdapter({
  issuerEndpoints: ['https://issuer.example.com'],
  verifierUrl: 'https://verifier.example.com'
});

// Multi-issuer for redundancy (if one fails, tries next)
const freebird = new FreebirdAdapter({
  issuerEndpoints: [
    'https://issuer1.example.com',
    'https://issuer2.example.com',
    'https://issuer3.example.com'
  ],
  verifierUrl: 'https://verifier.example.com'
});

// Blind recipient public key using P-256 VOPRF
const commitment = await freebird.blind(recipientKey);

// Issue anonymous token with DLEQ proof verification
// With multiple issuers: tries each sequentially until one succeeds
const token = await freebird.issueToken(commitment);

// Create unforgeable Schnorr ownership proof (bound to nullifier)
const proof = await freebird.createOwnershipProof(secret, nullifier);
```

**P-256 VOPRF (Verifiable Oblivious Pseudorandom Function):**
- Production-ready cryptographic blinding with DLEQ proofs
- Anonymous token issuance without revealing identity
- Verifiable: DLEQ proof ensures issuer used correct secret key
- Oblivious: Issuer cannot link token issuance to redemption
- Based on RFC 9497 and hash-to-curve (RFC 9380)

**Issuer Redundancy:**
- **Multiple Endpoints**: Configure multiple issuers for high availability
- **Sequential Fallback**: If one issuer fails, automatically tries the next
- **Independent Verification**: Each issuer's DLEQ proof is verified locally
- **Trust Policy**: For multi-issuer trust requirements, configure TrustPolicy on the Freebird verifier side

**Sybil Resistance Mechanisms:**
- **Invitation System**: Cryptographically signed invites with ban-trees and reputation tracking
- **Proof of Work**: Configurable computational cost requirements
- **Rate Limiting**: Anonymous token consumption tracking via nullifier sets (no user tracking)
- **WebAuthn/FIDO2**: Hardware-backed identity verification (optional)
- **Combined Defense**: Multiple mechanisms can be layered for stronger protection
- Configured via deployment environment (invitation/PoW/rate-limit/WebAuthn/combined/none)

### Witness: Timestamped Attestations

```typescript
const witness = new WitnessAdapter({
  gatewayUrl: 'https://witness.example.com',
  networkId: 'scarcity-mainnet'
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
import { FreebirdAdapter, WitnessAdapter, configureTor } from 'scarcity';

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
  ScarbuckToken,
  NullifierGossip,
  TransferValidator,
  FreebirdAdapter,
  WitnessAdapter,
  HyperTokenAdapter
} from 'scarcity';

// Initialize infrastructure
const freebird = new FreebirdAdapter({
  issuerEndpoints: ['https://issuer.example.com'],
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
const token = ScarbuckToken.mint(100, freebird, witness, gossip);

// Transfer to recipient
const recipientKey = { bytes: new Uint8Array(32) }; // recipient's public key
const transferPkg = await token.transfer(recipientKey);

// Recipient validates
const result = await validator.validateTransfer(transferPkg);

if (result.valid) {
  console.log(`Transfer accepted with ${(result.confidence * 100).toFixed(0)}% confidence`);

  // Receive the token
  const recipientSecret = new Uint8Array(32); // recipient's secret
  const receivedToken = await ScarbuckToken.receive(
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

## Phase 3: Advanced Features

### Token Splitting

Split a single token into multiple smaller tokens with specified amounts.

```typescript
import { ScarbuckToken } from 'scarcity';

// Mint a token
const token = ScarbuckToken.mint(100, freebird, witness, gossip);

// Split into 3 parts
const splitPkg = await token.split(
  [30, 40, 30],  // amounts (must sum to 100)
  [recipient1Key, recipient2Key, recipient3Key]  // one key per split
);

// Recipients receive their splits
const token1 = await ScarbuckToken.receiveSplit(
  splitPkg,
  recipient1Secret,
  0,  // split index
  freebird,
  witness,
  gossip
);
```

**Properties:**
- Amounts must sum to original token amount
- Each split gets a new token ID
- Original token is spent atomically
- All splits are created in a single timestamped transaction

### Token Merging

Combine multiple tokens into a single larger token.

```typescript
import { ScarbuckToken } from 'scarcity';

// Create multiple tokens
const token1 = ScarbuckToken.mint(30, freebird, witness, gossip);
const token2 = ScarbuckToken.mint(40, freebird, witness, gossip);
const token3 = ScarbuckToken.mint(30, freebird, witness, gossip);

// Merge into single token
const mergePkg = await ScarbuckToken.merge(
  [token1, token2, token3],
  recipientKey
);

// Recipient receives merged token
const mergedToken = await ScarbuckToken.receiveMerge(
  mergePkg,
  recipientSecret,
  freebird,
  witness,
  gossip
);

console.log(mergedToken.getMetadata().amount); // 100
```

**Properties:**
- All source tokens must be unspent
- All source tokens are spent atomically
- New token ID is generated for merged result
- Maintains double-spend prevention across all inputs

### Multi-Party Transfers

Transfer a token to multiple recipients atomically in a single transaction.

```typescript
import { ScarbuckToken } from 'scarcity';

const token = ScarbuckToken.mint(100, freebird, witness, gossip);

// Transfer to 3 recipients atomically
const multiPartyPkg = await token.transferMultiParty([
  { publicKey: alice, amount: 30 },
  { publicKey: bob, amount: 40 },
  { publicKey: carol, amount: 30 }
]);

// Each recipient receives their portion
const aliceToken = await ScarbuckToken.receiveMultiParty(
  multiPartyPkg,
  aliceSecret,
  0,  // recipient index
  freebird,
  witness,
  gossip
);
```

**Use Cases:**
- Payroll disbursements
- Revenue sharing
- Multi-party settlements
- Group payments

**Properties:**
- All-or-nothing atomicity
- Single nullifier for source token
- Each recipient gets unique token ID
- Amounts must sum to source token amount

### Conditional Payments (HTLCs)

Hash Time-Locked Contracts enable conditional payments based on cryptographic secrets or time constraints.

#### Hash-Locked Transfers

```typescript
import { ScarbuckToken, Crypto, type HTLCCondition } from 'scarcity';

// Create a secret preimage
const preimage = Crypto.randomBytes(32);
const hashlock = Crypto.hashString(Crypto.toHex(preimage));

// Create hash-locked transfer
const condition: HTLCCondition = {
  type: 'hash',
  hashlock
};

const htlcPkg = await token.transferHTLC(
  recipientKey,
  condition
);

// Recipient unlocks with preimage
const receivedToken = await ScarbuckToken.receiveHTLC(
  htlcPkg,
  recipientSecret,
  preimage,  // must match hashlock
  freebird,
  witness,
  gossip
);
```

**Use Cases:**
- Atomic swaps
- Cross-chain exchanges
- Trustless escrow
- Payment channels

#### Time-Locked Transfers

```typescript
// Timelock expires in 1 hour
const timelock = Date.now() + 3600_000;

const condition: HTLCCondition = {
  type: 'time',
  timelock
};

const htlcPkg = await token.transferHTLC(
  recipientKey,
  condition,
  refundKey  // required for time-locked HTLCs
);

// Recipient can claim before expiry
if (Date.now() < timelock) {
  const receivedToken = await ScarbuckToken.receiveHTLC(
    htlcPkg,
    recipientSecret,
    undefined,
    freebird,
    witness,
    gossip
  );
}

// Sender can refund after expiry
if (Date.now() >= timelock) {
  const refundedToken = await ScarbuckToken.refundHTLC(
    htlcPkg,
    refundSecret,
    freebird,
    witness,
    gossip
  );
}
```

**Use Cases:**
- Time-delayed payments
- Subscription renewals
- Conditional bounties
- Deadline-based escrow

### Cross-Federation Bridging

Transfer tokens between different Witness federations while maintaining security guarantees.

```typescript
import { FederationBridge, WitnessAdapter, NullifierGossip } from 'scarcity';

// Setup two federations
const sourceFederation = {
  witness: new WitnessAdapter({
    gatewayUrl: 'http://federation-a.example.com',
    networkId: 'federation-a'
  }),
  gossip: new NullifierGossip({ witness })
};

const targetFederation = {
  witness: new WitnessAdapter({
    gatewayUrl: 'http://federation-b.example.com',
    networkId: 'federation-b'
  }),
  gossip: new NullifierGossip({ witness })
};

// Create bridge
const bridge = new FederationBridge({
  sourceFederation: 'federation-a',
  targetFederation: 'federation-b',
  sourceWitness: sourceFederation.witness,
  targetWitness: targetFederation.witness,
  sourceGossip: sourceFederation.gossip,
  targetGossip: targetFederation.gossip,
  freebird
});

// Bridge token from source to target
const token = ScarbuckToken.mint(100, freebird, sourceFederation.witness, sourceFederation.gossip);

const bridgePkg = await bridge.bridgeToken(token, recipientKey);

// Recipient receives in target federation
const receivedToken = await bridge.receiveBridged(
  bridgePkg,
  recipientSecret
);

// Verify bridge succeeded
const isValid = await bridge.verifyBridge(bridgePkg);
```

**How It Works:**

1. **Lock Phase**: Token is locked in source federation via nullifier
2. **Proof Phase**: Source federation timestamps the lock
3. **Mint Phase**: Target federation validates source proof and mints equivalent token
4. **Verification**: Both federations maintain proofs for dispute resolution

**Properties:**
- Two-phase commit ensures atomicity
- Source token cannot be double-spent
- Target token requires proof from source
- Maintains traceability via token IDs

**Use Cases:**
- Cross-network value transfer
- Federation migration
- Multi-jurisdiction compliance
- Network interoperability

---

## CLI Tools

Scarcity includes a command-line interface (`scar`) for Phase 3 advanced token operations.

### Installation

```bash
npm install -g scarcity
# or run directly
npx scarcity
```

### Configuration

The CLI stores wallet data and configuration in `~/.scarcity/`:

```bash
# View current configuration
scar config list

# Set Witness gateway
scar config set witness.gatewayUrl http://localhost:5001
scar config set witness.networkId my-network

# Set Freebird services
scar config set freebird.issuerEndpoints http://localhost:8081
scar config set freebird.verifierUrl http://localhost:8082

# Or configure multiple issuers for redundancy (failover)
scar config set freebird.issuerEndpoints http://localhost:8081,http://localhost:8082,http://localhost:8083

# Set HyperToken relay
scar config set hypertoken.relayUrl ws://localhost:3000
```

### Wallet Management

```bash
# Create a new wallet
scar wallet create alice

# List all wallets
scar wallet list

# Show wallet public key
scar wallet show alice

# Export wallet (private keys - keep secure!)
scar wallet export alice

# Import wallet
scar wallet import bob <secret-key>
```

### Token Management

```bash
# List all tokens in a wallet
scar token list alice

# Show token details
scar token show <token-id>

# Mint a new token (for testing)
scar token mint alice 100
```

### Token Splitting

Split a single token into multiple smaller tokens:

```bash
# Split token into 3 parts: 30, 40, 30
scar split <token-id> \
  --amounts 30,40,30 \
  --recipients <pubkey1>,<pubkey2>,<pubkey3>

# Example with wallet public keys
scar split token-abc123 \
  --amounts 30,40,30 \
  --recipients $(scar wallet show alice -q),$(scar wallet show bob -q),$(scar wallet show carol -q)
```

**Options:**
- `--amounts, -a`: Comma-separated amounts (must sum to token amount)
- `--recipients, -r`: Comma-separated recipient public keys

### Token Merging

Combine multiple tokens into a single larger token:

```bash
# Merge 3 tokens into one
scar merge <token-id-1>,<token-id-2>,<token-id-3> \
  --recipient <recipient-pubkey> \
  --wallet alice

# Merge all Alice's tokens for Bob
scar merge $(scar token list alice --ids-only) \
  --recipient $(scar wallet show bob -q) \
  --wallet alice
```

**Options:**
- `--recipient, -r`: Recipient's public key
- `--wallet, -w`: Wallet containing the source tokens

### Multi-Party Transfers

Send token portions to multiple recipients in one atomic transaction:

```bash
# Split payment to 3 recipients
scar multiparty <token-id> \
  alice:30 bob:40 carol:30

# Using explicit public keys
scar multiparty token-abc123 \
  --split <pubkey1>:30,<pubkey2>:40,<pubkey3>:20
```

**Format:**
- `wallet:amount` - Uses wallet's public key
- `--split` with `pubkey:amount,pubkey:amount,...`

### Hash Time-Locked Contracts (HTLCs)

#### Create Hash-Locked Transfer

Lock a payment that can only be claimed with the correct preimage:

```bash
# Create HTLC with hash lock
scar htlc create <token-id> <recipient-pubkey> \
  --hash-lock <hash> \
  -H <hash>

# Generate preimage and create HTLC
PREIMAGE=$(openssl rand -hex 32)
HASH=$(echo -n "$PREIMAGE" | sha256sum | cut -d' ' -f1)
scar htlc create token-abc123 $(scar wallet show bob -q) \
  --hash-lock $HASH
```

#### Create Time-Locked Transfer

Lock a payment that can be claimed before expiry or refunded after:

```bash
# Lock for 1 hour (expires at timestamp)
EXPIRY=$(($(date +%s) * 1000 + 3600000))
scar htlc create <token-id> <recipient-pubkey> \
  --time-lock $EXPIRY \
  --refund-key <refund-pubkey> \
  -T $EXPIRY
```

#### Claim HTLC

Recipient claims the locked payment:

```bash
# Claim hash-locked HTLC with preimage
scar htlc claim <package-json> \
  --wallet bob \
  --preimage $PREIMAGE

# Claim time-locked HTLC before expiry
scar htlc claim htlc-package.json \
  --wallet bob
```

#### Refund HTLC

Original sender refunds after time lock expires:

```bash
# Refund expired time-locked HTLC
scar htlc refund <package-json> \
  --wallet alice
```

**HTLC Use Cases:**
- Atomic swaps between parties
- Conditional payments (unlock with secret)
- Time-delayed releases
- Cross-chain trading

### Cross-Federation Bridge

Transfer tokens between different Witness federations:

#### Bridge Transfer

Lock token in source federation and mint in target:

```bash
# Bridge to target federation
scar bridge transfer <token-id> <recipient-pubkey> \
  --target-gateway http://localhost:5002 \
  --target-network target-network \
  -g http://localhost:5002 \
  -n target-network

# Save bridge package for recipient
scar bridge transfer token-abc123 $(scar wallet show bob -q) \
  --target-gateway http://federation-b.example.com \
  --target-network fed-b \
  > bridge-package.json
```

#### Claim Bridged Token

Recipient claims in target federation:

```bash
# Switch to target federation
scar config set witness.gatewayUrl http://localhost:5002
scar config set witness.networkId target-network

# Claim the bridged token
scar bridge claim bridge-package.json \
  --wallet bob
```

**Bridge Properties:**
- Two-phase commit (lock source, mint target)
- Maintains traceability via token IDs
- Requires both federations to be online
- Atomic transfer (all or nothing)

### Package Management

Transfer packages can be saved and shared:

```bash
# Save package to file
scar split token-123 --amounts 50,50 --recipients ... > split.json

# Load package
scar token receive split.json --wallet bob

# Show package details
scar package show split.json
```

### Examples

**Complete workflow:**

```bash
# 1. Setup
scar config set witness.gatewayUrl http://localhost:5001
scar wallet create alice
scar wallet create bob

# 2. Mint token
scar token mint alice 100

# 3. Split for multiple recipients
TOKEN=$(scar token list alice --ids-only | head -1)
scar split $TOKEN \
  --amounts 40,60 \
  --recipients $(scar wallet show bob -q),$(scar wallet show alice -q)

# 4. Bob creates HTLC for atomic swap
BOB_TOKEN=$(scar token list bob --ids-only | head -1)
PREIMAGE=$(openssl rand -hex 32)
HASH=$(echo -n "$PREIMAGE" | sha256sum | cut -d' ' -f1)
scar htlc create $BOB_TOKEN $(scar wallet show alice -q) \
  --hash-lock $HASH \
  > htlc-package.json

# 5. Alice claims with preimage
scar htlc claim htlc-package.json \
  --wallet alice \
  --preimage $PREIMAGE
```

---

## Web Wallet Interface

Scarcity includes a modern web interface for managing wallets and tokens through your browser.

### Quick Start

```bash
# Start the web wallet server
npm run web

# Open in browser
open http://localhost:3000
```

The web wallet provides:
- **Visual wallet management**: Create, import, and manage wallets with a clean UI
- **Token operations**: Mint, transfer, receive, split, and merge tokens
- **Real-time updates**: Live balance and transaction history
- **Easy transfers**: Copy/paste transfer packages between wallets
- **No framework dependencies**: Pure HTML/CSS/JavaScript

### Features

**Wallet Management:**
- Create new wallets with generated keys
- Import wallets from secret keys
- Export secret keys for backup
- Set default wallet
- View public keys and balances

**Token Operations:**
- Mint new tokens
- Send tokens to recipients
- Receive tokens from transfer packages
- Split tokens into multiple parts
- Merge multiple tokens into one
- View transaction history

### Usage Flow

1. **Initialize Network**: Click "Initialize Network" to connect to Scarcity infrastructure
2. **Create Wallet**: Create or import a wallet to get started
3. **Mint Tokens**: Mint initial tokens for testing or use
4. **Transfer**: Send tokens using recipient public keys
5. **Receive**: Paste transfer package JSON to receive tokens
6. **Operations**: Use split/merge for flexible token management

### API Endpoints

The web wallet provides a REST API at `http://localhost:3000/api`:

```bash
# Health check
GET /api/health

# Initialize network
POST /api/init

# Wallet operations
GET  /api/wallets
POST /api/wallets
GET  /api/wallets/:name/balance

# Token operations
POST /api/tokens/mint
POST /api/tokens/transfer
POST /api/tokens/receive
POST /api/tokens/split
POST /api/tokens/merge
```

### Configuration

The web wallet uses the same configuration as the CLI:
- Config: `~/.scarcity/config.json`
- Wallets: `~/.scarcity/wallets.json`
- Tokens: `~/.scarcity/tokens.json`

### Custom Port

```bash
# Run on custom port
PORT=8080 npm run web
```

### Development

```bash
# Build and run
npm run web:dev

# File structure
src/web/
├── server.ts           # Express API server
├── public/
│   ├── index.html     # Main interface
│   ├── styles.css     # UI styling
│   └── app.js         # Frontend logic
└── README.md          # Detailed docs
```

See [src/web/README.md](src/web/README.md) for complete documentation.

---

## Nullscape Explorer

Real-time nullifier feed and network transparency tool for monitoring the Scarcity network.

### Quick Start

```bash
# Start the explorer
npm run explorer

# Open in browser
open http://localhost:3001
```

The Nullscape Explorer provides:
- **Real-time nullifier feed**: Live WebSocket updates as nullifiers propagate
- **Persistent storage**: SQLite database for historical records
- **Search & query**: Find nullifiers by hex, token ID, or federation
- **Network statistics**: Activity metrics, peer counts, witness depth
- **Activity charts**: Visual timeline of network activity
- **Dark theme UI**: Modern monitoring interface

### Features

**Real-Time Monitoring:**
- WebSocket feed of new nullifiers
- Live network statistics
- Instant search and filtering

**Historical Analysis:**
- Persistent SQLite storage
- 24-hour activity charts
- Per-federation statistics
- Nullifier count trends

**Network Transparency:**
- Double-spend detection visibility
- Peer count tracking
- Witness depth monitoring
- Federation activity comparison

### Usage Flow

1. **Start Collecting**: Click "Start Collecting" to monitor the network
2. **View Feed**: Watch nullifiers appear in real-time
3. **Inspect Details**: Click any nullifier for full proof details
4. **Search**: Find specific nullifiers by hex
5. **Analyze**: Check activity charts and federation stats

### API Endpoints

The explorer provides a REST API at `http://localhost:3001/api`:

```bash
# Get network statistics
GET /api/stats

# Recent nullifiers (paginated)
GET /api/nullifiers?limit=50&offset=0

# Search by hex
GET /api/nullifiers/search?q=<hex>

# Hourly activity chart data
GET /api/activity/hourly

# Federation statistics
GET /api/federations/stats
```

### Configuration

The explorer uses the same infrastructure config as the CLI:
- Config: `~/.scarcity/config.json`
- Database: `~/.scarcity/explorer.db`

### Custom Port

```bash
# Run on custom port
PORT=8080 npm run explorer
```

### Privacy Considerations

**What's Public in Nullscape:**
- Nullifiers (spent token markers)
- Witness proofs and timestamps
- Peer counts and network metrics

**What Remains Private:**
- Sender/recipient identities (Freebird anonymity preserved)
- Token amounts (not stored in nullifiers)
- Transaction linkability (nullifiers are unlinkable)

Nullscape provides transparency without compromising core privacy guarantees.

See [src/explorer/README.md](src/explorer/README.md) for complete documentation.

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
npm run test:phase3         # Phase 3 advanced features
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
- Configure Sybil resistance (invitation system/PoW/rate-limit/WebAuthn/combined)
- Hardware-backed keys (HSM)
- TLS required for all token transmission
- Monitor nullifier sets for replay attack attempts

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

**Phase 3: Advanced Features** ✅ **COMPLETE** (4/4 complete, 100%)
- [x] Token splitting/merging ✅ **COMPLETE**
- [x] Multi-party transfers ✅ **COMPLETE**
- [x] Conditional payments (HTLCs) ✅ **COMPLETE**
- [x] Cross-federation bridging ✅ **COMPLETE**

**Phase 4: Tooling** 🔨 **IN PROGRESS** (3/4 complete, 75%)
- [x] Web wallet interface ✅ **COMPLETE**
- [ ] Mobile SDK (React Native) 📱 **[ROADMAP](docs/MOBILE_SDK_ROADMAP.md)**
- [x] CLI tools for Phase 3 operations ✅ **COMPLETE** (split, merge, multiparty, HTLC, bridge)
- [x] Nullscape Explorer (nullifier viewer) ✅ **COMPLETE**

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

## Security

Scarcity implements **defense-in-depth** security across multiple layers:

### Availability Protection (DoS Mitigation)
- **Peer Reputation Scoring**: Automatic disconnection of malicious peers
- **Leaky Bucket Rate Limiting**: 10 msg/sec per peer prevents flooding
- **Proof-of-Work Puzzles**: Optional computational cost for spam resistance
- **Timestamp Validation**: Early rejection of invalid nullifiers

### Integrity Protection (Phase 1 Hardening)
- **Multi-Gateway Quorum**: Query 2-of-3 gateways to prevent censorship
- **Outbound Peer Preference**: Weight trusted outbound peers 3x higher
- **IP Subnet Diversity**: Detect and warn about Sybil attacks from same network
- **Issuer Redundancy**: Multiple issuers with sequential failover for high availability

### Configuration Examples

**High-Security Setup:**
```typescript
// Multi-gateway Witness with quorum
const witness = new WitnessAdapter({
  gatewayUrls: [
    'https://witness1.example.com',
    'https://witness2.example.com',
    'https://witness3.example.com'
  ],
  quorumThreshold: 2,  // 2-of-3 agreement required
  powDifficulty: 16    // ~50-200ms computational cost
});

// Gossip with peer diversity
const gossip = new NullifierGossip({
  witness,
  peerScoreThreshold: -50,
  maxTimestampFuture: 5,
  maxNullifierAge: 86400000  // 24 hours
});

// Add diverse outbound peers
const outboundPeer = {
  id: 'trusted-peer-1',
  direction: 'outbound',  // Connection YOU initiated
  remoteAddress: '203.0.113.1',
  send: async (data) => { /* ... */ },
  isConnected: () => true
};

gossip.addPeer(outboundPeer);

// Validator with high confidence
const validator = new TransferValidator({
  gossip,
  witness,
  waitTime: 5000,
  minConfidence: 0.8  // 80% confidence required
});
```

**Monitor Security:**
```typescript
// Check subnet diversity
const subnetStats = gossip.getSubnetStats();
console.log('Subnet diversity:', subnetStats.size);

// Check peer direction mix
const peers = gossip.peers;
const outbound = peers.filter(p => p.direction === 'outbound').length;
console.log(`Outbound: ${outbound}, Total: ${peers.length}`);

// Check peer reputation
const scores = gossip.getAllPeerScores();
for (const [peerId, score] of scores) {
  if (score.score < -20) {
    console.warn(`⚠️ Low-reputation peer: ${peerId}`);
  }
}
```

For complete security details, threat models, and attack cost analysis, see **[SECURITY.md](SECURITY.md)**.

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
A: Phases 1-3 are complete with all core features implemented and tested. Phase 2 hardening (BLS aggregation, WebRTC, production VOPRF, Tor support) is complete. Phase 3 advanced features (split/merge, HTLCs, bridging) are complete with CLI tools. This is still a research prototype - production deployment requires security audits, stress testing, and operational hardening.

**Q: What are HTLCs and why would I use them?**
A: Hash Time-Locked Contracts enable conditional payments. Use hash locks for atomic swaps (both parties trade secrets), or time locks for refundable payments (claim before deadline or get refunded). Perfect for trustless escrow and cross-chain exchanges.

**Q: Can I transfer tokens between different federations?**
A: Yes! Use the bridge feature to transfer tokens between different Witness federations. The bridge uses a two-phase commit: lock token in source federation, then mint equivalent in target. Both CLI (`scar bridge`) and programmatic API are available.

**Q: How do I split or merge tokens?**
A: Use `scar split` to divide one token into multiple smaller tokens, or `scar merge` to combine multiple tokens into one. This is useful for making change, consolidating funds, or distributing payments. Both operations are atomic and maintain double-spend protection.

**Q: Do I need to run my own infrastructure?**
A: Not necessarily. You can connect to existing Witness federations, Freebird services, and HyperToken relays. For maximum privacy and sovereignty, run your own. The CLI makes it easy to switch between federations via config.

---

## License

Apache License 2.0

---

## Related Projects

- **[Freebird](https://github.com/flammafex/freebird)**: Anonymous authorization infrastructure
- **[HyperToken](https://github.com/flammafex/hypertoken)**: Distributed state synchronization
- **[Witness](https://github.com/flammafex/witness)**: Threshold signature timestamping

**Scarcity: You're fucking with the best.**
