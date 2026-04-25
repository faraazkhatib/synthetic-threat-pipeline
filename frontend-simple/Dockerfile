# Build phase
FROM node:20-alpine as build
WORKDIR /app

# Copy dependencies and install
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the frontend files
COPY . ./

# Build the frontend
RUN npm run build

# Production phase - Serve the built files using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to access the web app
EXPOSE 80

# Start Nginx to serve the app
CMD ["nginx", "-g", "daemon off;"]
