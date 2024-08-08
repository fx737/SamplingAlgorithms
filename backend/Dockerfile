# backend/Dockerfile

# Use the official Node.js image as the base image
FROM node:alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port 8080 to the outside world
EXPOSE 8080

# Start the backend service
CMD ["node", "index.js"]
