FROM node:lts

# Install PostgreSQL client (optional but useful for Heroku CLI or pg:psql)
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Optimized layer caching: install deps first
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY . .

# Expose app port
EXPOSE 3000

# Default command
CMD ["node", "src/server.js"]
