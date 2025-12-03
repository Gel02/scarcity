# ==============================================================================
# Stage 1: Builder
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
# Install all dependencies (including dev) for building and testing
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# ==============================================================================
# Stage 2: Test Runner / Runtime
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
# We need netcat (nc) for the wait-for-it script in the compose file
RUN apk add --no-cache netcat-openbsd curl

# Copy everything from builder (includes source, dist, node_modules with devDeps)
COPY --from=builder /app ./ 

# Default environment variables for docker networking
ENV FREEBIRD_ISSUER_URL="http://freebird-issuer:8081"
ENV FREEBIRD_VERIFIER_URL="http://freebird-verifier:8082"
ENV WITNESS_GATEWAY_URL="http://witness-gateway:8080"
ENV HYPERTOKEN_RELAY_URL="ws://hypertoken-relay:3000"

# Default command runs the integration tests
CMD ["npm", "test"]