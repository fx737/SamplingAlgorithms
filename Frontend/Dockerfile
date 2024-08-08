# Use the official Nginx image to serve the static site
FROM nginx:alpine

# Copy the static site files into the container
COPY . /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 80

# Nginx runs by default, so no CMD is needed
