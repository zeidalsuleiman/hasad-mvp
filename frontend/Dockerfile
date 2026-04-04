FROM node:18-alpine

WORKDIR /app

# Create persistent node_modules volume location
RUN mkdir -p /app/node_modules

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (npm install is more flexible than npm ci for development)
RUN npm install

# Copy application files
COPY . .

# Set environment
ENV NODE_ENV=production
ENV REACT_APP_API_BASE=http://localhost:8000

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Serve with nginx or use a simple server
RUN npm install -g serve

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
