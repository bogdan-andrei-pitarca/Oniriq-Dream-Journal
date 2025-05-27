# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the production application
# Use a Node.js image that includes npm
FROM node:20-alpine AS runner

# Set the working directory
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