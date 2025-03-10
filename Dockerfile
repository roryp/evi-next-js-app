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
# Set environment variables
RUN export OPENAI_API_KEY=$(cat openai_api_key.txt) && \
    export HUME_API_KEY=$(cat hume_api_key.txt) && \
    export HUME_SECRET_KEY=$(cat hume_secret_key.txt) && \
    echo "OPENAI_API_KEY=$(cat openai_api_key.txt)" > .env && \
    echo "HUME_API_KEY=$(cat hume_api_key.txt)" >> .env && \
    echo "HUME_SECRET_KEY=$(cat hume_secret_key.txt)" >> .env

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

# Make sure environment variables are set in the runtime environment
RUN export OPENAI_API_KEY=$(cat openai_api_key.txt) && \
    export HUME_API_KEY=$(cat hume_api_key.txt) && \
    export HUME_SECRET_KEY=$(cat hume_secret_key.txt) && \
    echo "OPENAI_API_KEY=$(cat openai_api_key.txt)" > .env && \
    echo "HUME_API_KEY=$(cat hume_api_key.txt)" >> .env && \
    echo "HUME_SECRET_KEY=$(cat hume_secret_key.txt)" >> .env

# Expose port
EXPOSE 3000

# Start in dev mode to avoid build issues with static generation
CMD ["pnpm", "dev"]