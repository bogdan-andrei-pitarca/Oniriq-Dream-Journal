# Stage 1: Build the Next.js application
# Use a Node.js image with a later version suitable for building
FROM node:20-alpine AS builder

# Set the working directory for the builder stage
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies, including devDependencies needed for the build
RUN npm install

# Copy the rest of your frontend source code
COPY . .

# Build the Next.js application
# Ensure your build script in package.json is 'next build'
RUN npm run build

# Stage 2: Run the production application
# Use a minimal base image, as the standalone output includes Node.js
FROM node:20-alpine

# Set the working directory for the runner stage
# This should match the output directory of the standalone build
WORKDIR /app

# Copy the standalone output from the builder stage
# The path /.next/standalone is relative to the builder's WORKDIR
COPY --from=builder /app/.next/standalone ./

# Copy the public directory from the original source
# This is needed for static assets like favicon.ico, images, etc.
COPY --from=builder /app/public ./public

# Expose the port Next.js production server listens on (typically 3000 by default, but can be set by PORT env var)
# Railway will manage port mapping externally.
EXPOSE 3000

# Command to run the standalone Next.js server
# This matches the Start Command we configured on Railway earlier
CMD ["node", "server.js"]