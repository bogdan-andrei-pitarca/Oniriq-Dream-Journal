# Use a lightweight Node.js image as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# This allows caching of dependencies
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the backend source code into the working directory
COPY . .

# Expose the port your application listens on (default 5000 based on your logs)
EXPOSE 5000

# Command to run your backend server when the container starts
# Using 'npm start' which should execute 'node src/server.js' from your package.json
CMD [ "npm", "start" ]