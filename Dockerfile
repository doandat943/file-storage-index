# Base image using Node.js
FROM node:alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Create production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Ensure proper access rights for nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Run the application
CMD ["npm", "start"] 