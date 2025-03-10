FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS dependencies
# Copy package configs first
COPY package.json pnpm-lock.yaml ./
COPY postcss.config.mjs tailwind.config.ts ./
# Install all dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Build the app
FROM dependencies AS build
# Copy the rest of the application
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Define secrets mounts
RUN --mount=type=secret,id=openai_key \
    --mount=type=secret,id=hume_key \
    --mount=type=secret,id=hume_secret \
    echo "OPENAI_API_KEY=$(cat /run/secrets/openai_key)" > .env && \
    echo "HUME_API_KEY=$(cat /run/secrets/hume_key)" >> .env && \
    echo "HUME_SECRET_KEY=$(cat /run/secrets/hume_secret)" >> .env

# Production image
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy all files from build stage
COPY --from=build /app/ ./

# Make sure we have all dependencies including dev dependencies
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3000

# Start in dev mode to avoid build issues with static generation
CMD ["pnpm", "dev"]