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
    'echo "Waiting for database to be ready..."' \
    'until pg_isready -h db -U postgres; do' \
    '  sleep 1' \
    'done' \
    'echo "Database is ready!"' \
    '' \
    'echo "Creating database if it does not exist..."' \
    'PGPASSWORD=postgres psql -h db -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '"'"'lms'"'"'" | grep -q 1 || PGPASSWORD=postgres psql -h db -U postgres -c "CREATE DATABASE lms"' \
    '' \
    'echo "Running migrations..."' \
    'npx prisma migrate deploy' \
    '' \
    'echo "Seeding database..."' \
    'npx prisma db seed' \
    '' \
    'echo "Starting Prisma Studio..."' \
    'npx prisma studio --port 5555 &' \
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