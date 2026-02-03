# ==================================================
# Stage 1: Base Image with All Runtimes
# ==================================================
FROM node:20-bullseye AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Python 3 runtime
    python3 \
    python3-pip \
    # Java Development Kit 17
    openjdk-17-jdk \
    # C compiler
    gcc \
    g++ \
    make \
    # Docker CLI (for C simulator)
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    # Emscripten dependencies
    git \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Install Emscripten SDK
ENV EMSDK_VERSION=3.1.50
RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
    cd /emsdk && \
    ./emsdk install ${EMSDK_VERSION} && \
    ./emsdk activate ${EMSDK_VERSION} && \
    rm -rf /emsdk/.git

# Set environment variables for Java
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Set environment variables for Emscripten
ENV EMSDK=/emsdk
ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"

# Install pnpm globally
RUN npm install -g pnpm@10.27.0

# Set CI environment variable for pnpm
ENV CI=true

WORKDIR /app

# ==================================================
# Stage 2: Dependencies Installation
# ==================================================
FROM base AS dependencies

# Copy monorepo workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (production only)
RUN pnpm install --frozen-lockfile --prod

# ==================================================
# Stage 3: Builder (Compile Java Agent + TypeScript)
# ==================================================
FROM dependencies AS builder

# Install dev dependencies for building
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build shared package first (required by backend and frontend)
WORKDIR /app
RUN pnpm --filter @codeinsight/shared build

# Build Java Debugger Agent
WORKDIR /app/packages/backend/src/modules/simulators/java/agent
RUN mkdir -p build/classes && \
    javac -encoding UTF-8 -d build/classes src/main/java/com/vis/*.java && \
    jar cfe build/debugger-agent.jar com.vis.DebuggerAgent -C build/classes .

# Generate Prisma Client (required for .prisma/client)
WORKDIR /app/packages/backend
RUN pnpm prisma generate

# Build TypeScript (backend)
WORKDIR /app
RUN pnpm --filter @codeinsight/backend build

# Build Frontend (for static serving)
RUN pnpm --filter @codeinsight/frontend build

# ==================================================
# Stage 4: Production Runtime
# ==================================================
FROM base AS production

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy compiled backend
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma

# Copy compiled Java agent
COPY --from=builder /app/packages/backend/src/modules/simulators/java/agent/build ./packages/backend/src/modules/simulators/java/agent/build

# Copy Python agent
COPY --from=builder /app/packages/backend/src/modules/simulators/python/agent ./packages/backend/src/modules/simulators/python/agent

# Copy shared package
COPY --from=builder /app/packages/shared ./packages/shared

# Copy root package.json and workspace config
COPY package.json pnpm-workspace.yaml ./

# Create necessary directories
RUN mkdir -p /app/packages/backend/tmp /app/packages/backend/logs /app/packages/backend/data

# Set working directory to backend
WORKDIR /app/packages/backend

# Expose backend port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start backend server
CMD ["node", "dist/app.js"]
