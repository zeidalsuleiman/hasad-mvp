FROM node:18-alpine

WORKDIR /app

# Create persistent node_modules volume location
RUN mkdir -p /app/node_modules

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set environment for development
ENV NODE_ENV=development
ENV REACT_APP_API_BASE=http://localhost:8000

# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "start"]
