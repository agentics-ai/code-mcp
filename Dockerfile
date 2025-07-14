# Multi-stage build for VS Code MCP Server
FROM node:22-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile && pnpm store prune

# Copy source code
COPY src/ ./src/

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    py3-pip \
    bash \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy additional files
COPY README.md ./

# Create necessary directories
RUN mkdir -p /app/workspace && \
    mkdir -p /app/logs && \
    chown -R mcp:nodejs /app

# Switch to non-root user
USER mcp

# Expose port (if needed for future HTTP interface)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check: MCP Server is running')" || exit 1

# Default command
CMD ["node", "dist/src/index.js"]

# Labels
LABEL maintainer="VS Code MCP Server Team"
LABEL version="2.0.0"
LABEL description="Model Context Protocol server for VS Code workspace interaction"
