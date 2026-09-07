# Use official Node.js LTS lightweight Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifest files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --production

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 4000

# Set production environment variable
ENV NODE_ENV=production
ENV PORT=4000

# Start Node.js MMO backend server
CMD ["node", "index.js"]
