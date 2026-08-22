# This file originally comes from the Next JS Dockerfile example:
# https://github.com/vercel/next.js/tree/canary/examples/with-docker
# With some recommendations taken from PNPM docs: https://pnpm.io/docker

# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Node.js Version Maintenance
# To ensure security and compatibility, regularly update the NODE_VERSION ARG to the latest LTS version.
FROM node:24.19.0-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS dependencies

# Set working directory
WORKDIR /app

ENV CI="true"

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json5 pnpm-lock.yaml pnpm-workspace.yaml ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ============================================
# Custom RecordRanks stage to generate ICO file
# ============================================

FROM base AS ico-generator

# Set working directory
WORKDIR /app

RUN apt update && apt install -y inkscape imagemagick

# Copy icon converting script and icon files (icon.svg is optional, hence the [g] at the end)
COPY convert-svg-to-ico.sh icon.sv[g] icon.*.svg ./

ARG PROJECT_ID

# Convert SVG icon to ICO (the file path ends up as /app/app/favicon.ico)
RUN mkdir app && ./convert-svg-to-ico.sh "$PROJECT_ID"

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM base AS builder

# Set working directory
WORKDIR /app

ENV CI="true"

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Copy ICO file from ico-generator stage
COPY --from=ico-generator /app/app/favicon.ico ./app/

ENV NODE_ENV=production
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_PROJECT_NAME
ARG NEXT_PUBLIC_AUTH_PROVIDERS
ARG NEXT_PUBLIC_MULTITENANCY_ENABLED
ARG NEXT_PUBLIC_TRUSTCAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_VERSION
ARG NEXT_PUBLIC_BUILD_DATE

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
# If you want to speed up Docker rebuilds, you can cache the build artifacts
# by adding: --mount=type=cache,target=/app/.next/cache
# This caches the .next/cache directory across builds, but it also prevents
# .next/cache/fetch-cache from being included in the final image, meaning
# cached fetch responses from the build won't be available at runtime.
RUN --mount=type=cache,target=/app/.next/cache pnpm run build

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM base AS runner

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the run time.
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY ./server/logger-utils.js ./server/logger-utils.js
COPY ./server/email/templates ./server/email/templates

# If you want to persist the fetch cache generated during the build so that
# cached responses are available immediately on startup, uncomment this line:
# COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]