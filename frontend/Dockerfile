# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Set build arguments for Next.js public environment variables
# ARG NEXT_PUBLIC_API_URL # Keep as ARG
# ARG NEXT_PUBLIC_WEBSOCKET_URL # Keep as ARG
# Add any other NEXT_PUBLIC_ variables here as ARGs

# Set environment variables within the container for the build process
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL # Keep as ENV
# ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL # Keep as ENV
# Set other NEXT_PUBLIC_ variables as ENV variables here

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build the Next.js application - explicitly pass env vars to the build command
# Ensure NEXT_PUBLIC_ variables are available during the build for inlining
RUN NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL} npm run build

# Stage 2: Run the production application
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set runtime environment variables (redundant for NEXT_PUBLIC_ due to inlining, but good practice)
# These will be available in the serverless functions/server-side code
ENV NODE_ENV=production
# Removed hardcoded PORT environment variable
# ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}

# Expose the port Next.js listens on (default 3000)
EXPOSE 3000

CMD ["npm", "start"]