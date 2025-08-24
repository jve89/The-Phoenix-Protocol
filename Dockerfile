# Pinned base for reproducibility
FROM node:22.17.1-alpine

# Environment
ENV NODE_ENV=production \
    TZ=UTC

# Working directory
WORKDIR /app

# Create non-root user
RUN addgroup -S nodegrp && adduser -S app -G nodegrp

# Copy manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy only what is needed at runtime
COPY src ./src
COPY public ./public
COPY templates ./templates
COPY config ./config
COPY content ./content

# Drop privileges
USER app

EXPOSE 3000
CMD ["node", "src/server.js"]
