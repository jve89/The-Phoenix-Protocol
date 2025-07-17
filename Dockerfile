FROM node:lts

# Install PostgreSQL client for CLI tools (optional)
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Expose app port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
