FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the app
FROM dependencies AS build
COPY . .
RUN --mount=type=secret,id=openai_api_key \
    export OPENAI_API_KEY=$(cat /run/secrets/openai_api_key) && \
    pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Set build arguments
ARG OPENAI_API_KEY

# Set environment variables
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Copy necessary files from build stage
COPY --from=build /app/next.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]