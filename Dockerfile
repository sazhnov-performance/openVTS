# Use a Node.js base image
FROM node:18-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install all dependencies for building
RUN npm install

# Copy the rest of the application files (source only; .dockerignore excludes node_modules, .next, etc.)
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller runtime image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary files from the build stage (production files)
COPY --from=build /app ./

# Install only production dependencies in the final image
RUN npm install --omit=dev --verbose

# Use same port as Spring Boot (8080) for drop-in replacement
ENV PORT=8080
EXPOSE 8080

# Start the Next.js app in production mode
CMD ["npm", "start"]
