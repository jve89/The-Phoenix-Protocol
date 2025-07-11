# Dockerfile
FROM node:lts

# Install PostgreSQL client
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Install Heroku CLI
RUN curl https://cli-assets.heroku.com/install.sh | sh

# Set working directory
WORKDIR /workspace

# Copy package files early for caching
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Default command
CMD ["node", "src/server.js"]
