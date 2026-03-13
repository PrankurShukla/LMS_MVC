# Build stage
FROM node:18-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install necessary packages
RUN apk add --no-cache openssl curl postgresql-client

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Create startup script
RUN printf '%s\n' \
    '#!/bin/sh' \
    'echo "Starting Backend Application..."' \
    '' \
    '# Run migrations' \
    'echo "Running migrations..."' \
    'npx prisma migrate deploy' \
    '' \
    '# Seed database if SEED_DATABASE is true' \
    'if [ "$SEED_DATABASE" = "true" ]; then' \
    '  echo "Seeding database..."' \
    '  npx prisma db seed' \
    'fi' \
    '' \
    '# Start Prisma Studio only if explicitly requested' \
    'if [ "$START_PRISMA_STUDIO" = "true" ]; then' \
    '  echo "Starting Prisma Studio..."' \
    '  npx prisma studio --port 5555 &' \
    'fi' \
    '' \
    'echo "Starting application..."' \
    'exec npm start' \
    > /app/start.sh && chmod +x /app/start.sh

# Set proper permissions
RUN chown -R nodejs:nodejs /app
RUN chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Start the application
CMD ["sh", "./start.sh"] 