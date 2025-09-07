# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json files first for better caching
COPY package.json ./
COPY client/package.json ./client/

# Install root dependencies
RUN npm install --omit=dev

# Install client dependencies
RUN cd client && npm install

# Copy source code
COPY . .

# Build React app
RUN cd client && npm run build

# Remove client node_modules to save space
RUN rm -rf client/node_modules

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]