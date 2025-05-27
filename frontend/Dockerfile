# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies, including devDependencies needed for the build
RUN npm install

# Set environment variables for Next.js public variables BEFORE copying code and building
# These values come from build arguments passed via docker-compose.yml
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}
# Add other NEXT_PUBLIC_ variables here

# Copy the rest of your frontend source code
COPY . .

# Build the Next.js application
# NEXT_PUBLIC_ variables set via ENV above should be available here for inlining
RUN npm run build

# Stage 2: Run the production application
FROM node:20-alpine AS runner

WORKDIR /app

# Copy necessary files from the builder stage
# Copy production dependencies (node_modules)
COPY --from=builder /app/node_modules ./node_modules
# Copy the build output
COPY --from=builder /app/.next ./.next
# Copy package.json (needed for 'npm start')
COPY --from=builder /app/package.json ./package.json
# Copy the public directory for static assets
COPY --from=builder /app/public ./public



# Expose the port Next.js listens on (default 3000)
EXPOSE 3000

# Command to run the production server using the start script
CMD ["npm", "start"]