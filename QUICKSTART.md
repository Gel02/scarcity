# ⚡ Scarcity Quickstart

Run the entire Scarcity ecosystem (Freebird, Witness, HyperToken) and integration tests with a single command.

## Prerequisites

- Docker & Docker Compose

## Usage

### 1. Run Everything
This will build Scarcity, pull/build all dependencies (Freebird, Witness), start the network, and run the integration test suite.

```bash
docker compose up --build --abort-on-container-exit
```

### 2. Interactive Development
If you want to run the services in the background and execute commands manually:

```bash
# Start infrastructure in background
docker compose up -d freebird-issuer freebird-verifier witness-gateway hypertoken-relay

# Run tests manually
docker compose run --rm scarcity-tests npm test

# Run CLI manually against the docker network
docker compose run --rm scarcity-tests ./dist/src/cli/index.js wallet list
```

## Architecture

The Compose file spins up:
- **Freebird**: Issuer (8081), Verifier (8082), Redis
- **Witness**: Gateway (8080), Witness Node (3000)
- **HyperToken**: Relay (3000->8080)