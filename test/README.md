# Scarcity Integration Tests

Comprehensive test suite for validating Scarcity's end-to-end functionality with real and simulated infrastructure.

## Test Structure

```
test/
├── helpers/
│   └── test-utils.ts          # Test utilities and helpers
├── integration/
│   ├── 01-basic-transfer.test.ts      # Full token transfer flow
│   ├── 02-double-spend.test.ts        # Double-spend prevention
│   └── 03-graceful-degradation.test.ts # Fallback mode testing
└── run-integration-tests.ts   # Test runner
```

## Running Tests

### Run All Tests
```bash
npm test
# or
npm run test:integration
```

### Run Individual Test Suites
```bash
npm run test:basic          # Basic token transfer
npm run test:double-spend   # Double-spend detection
npm run test:degradation    # Graceful degradation
```

### Run Specific Test
```bash
npm run build
node test/integration/01-basic-transfer.test.js
```

## Test Modes

### 1. Full Stack Mode (All Services Running)

Tests use real infrastructure when available:
- HyperToken relay server on `ws://localhost:8080`
- Witness gateway on `http://localhost:8080`
- Freebird issuer on `http://localhost:8081`
- Freebird verifier on `http://localhost:8082`

### 2. Fallback Mode (No Services)

Tests automatically fall back to simulated mode when services are unavailable. All tests pass in both modes.

### 3. Mixed Mode (Some Services Available)

Tests adapt to partial infrastructure availability, using real services where possible and falling back for unavailable ones.

## Setting Up Infrastructure

### Option 1: Quick Test (No Setup Required)

Just run the tests! They work in fallback mode:
```bash
npm test
```

### Option 2: Full Stack Testing

#### Step 1: Start HyperToken Relay
```bash
# Terminal 1
git clone https://github.com/flammafex/hypertoken
cd hypertoken
cat > relay.js << 'EOF'
import { RelayServer } from './network/RelayServer.js';
const relay = new RelayServer({ port: 8080, verbose: true });
relay.start();
console.log('Relay server on ws://localhost:8080');
EOF
node relay.js
```

#### Step 2: Start Witness Network
```bash
# Terminal 2
git clone https://github.com/flammafex/witness
cd witness
./examples/setup.sh
./examples/start.sh
# Starts 3 witness nodes (3001-3003) + gateway (8080)
```

#### Step 3: Start Freebird Services
```bash
# Terminal 3 & 4
git clone https://github.com/flammafex/freebird
cd freebird

# Terminal 3: Issuer
docker-compose up issuer

# Terminal 4: Verifier
docker-compose up verifier
```

#### Step 4: Run Tests
```bash
# Terminal 5
cd /path/to/scarcity
npm test
```

## Test Suites

### 01: Basic Token Transfer

Tests the complete token lifecycle:
1. ✅ HyperToken connection
2. ✅ Gossip network setup
3. ✅ Validator configuration
4. ✅ Token minting
5. ✅ Recipient key generation
6. ✅ Token transfer
7. ✅ Gossip propagation
8. ✅ Transfer validation
9. ✅ Token reception

**Expected Result:** All 9 tests pass

### 02: Double-Spend Detection

Tests nullifier-based double-spend prevention:
1. ✅ Token minting
2. ✅ First transfer (legitimate)
3. ✅ Nullifier propagation
4. ✅ First transfer validation
5. ✅ Double-spend attempt detection
6. ✅ Nullifier republish detection
7. ✅ Confidence persistence

**Expected Result:** Double-spend attempts are correctly rejected

### 03: Graceful Degradation

Tests fallback behavior when services are unavailable:
1. ✅ Freebird fallback mode
2. ✅ Witness fallback mode
3. ✅ HyperToken connection failure handling
4. ✅ End-to-end transfer in fallback mode
5. ✅ Mixed service availability

**Expected Result:** All operations work in fallback mode

## Test Output

### Successful Run
```
████████████████████████████████████████████████████████████
SCARCITY INTEGRATION TEST SUITE
████████████████████████████████████████████████████████████

🔍 Checking service availability...

⏭️  HyperToken Relay: (skipped)
✅ Witness Gateway: Available
✅ Freebird Issuer: Available
✅ Freebird Verifier: Available

💡 Tests will run in fallback mode for unavailable services

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running: Graceful Degradation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All tests passed!

████████████████████████████████████████████████████████████
FINAL RESULTS
████████████████████████████████████████████████████████████
✅ Graceful Degradation
✅ Basic Token Transfer
✅ Double-Spend Detection

────────────────────────────────────────────────────────────
Total Suites: 3
Passed: 3
Failed: 0
Pass Rate: 100.0%
────────────────────────────────────────────────────────────

✅ All tests passed!
```

## Troubleshooting

### Tests Fail with "Connection Refused"

**Cause:** Services are not running
**Solution:** Tests should automatically fall back. If not, check that services URLs match your setup.

### "Double-spend not detected"

**Cause:** Gossip propagation too fast or validator too lenient
**Solution:** This is actually a test failure - the system should detect double-spends. Check gossip network setup.

### TypeScript Build Errors

**Solution:**
```bash
npm install
npm run build
```

### Tests Timeout

**Cause:** Network operations taking too long
**Solution:** Increase timeouts in validator config or check network connectivity

## Continuous Integration

To run tests in CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Integration Tests
  run: |
    npm install
    npm run build
    npm test
```

Tests run in fallback mode without requiring external services, making them CI-friendly.

## Writing New Tests

See `test/helpers/test-utils.ts` for utilities:

```typescript
import { TestRunner, createTestKeyPair, sleep } from '../helpers/test-utils.js';

export async function runMyTest(): Promise<void> {
  const runner = new TestRunner();

  await runner.run('My test case', async () => {
    // Test logic here
    runner.assert(condition, 'Error message');
    runner.assertEquals(actual, expected);
  });

  runner.printSummary();
}
```

## Next Steps

- Add performance benchmarks
- Add stress tests with many peers
- Add network partition simulation
- Add Byzantine fault injection
- Add CLI for interactive testing
