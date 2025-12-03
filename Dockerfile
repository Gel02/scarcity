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

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
# Copy test files if they aren't in dist (depends on tsconfig, usually they are)
# COPY --from=builder /app/test ./test 

# Default environment variables for docker networking
ENV FREEBIRD_ISSUER_URL="http://freebird-issuer:8081"
ENV FREEBIRD_VERIFIER_URL="http://freebird-verifier:8082"
ENV WITNESS_GATEWAY_URL="http://witness-gateway:8080"
ENV HYPERTOKEN_RELAY_URL="ws://hypertoken-relay:3000"

# Default command runs the integration tests
CMD ["npm", "test"]