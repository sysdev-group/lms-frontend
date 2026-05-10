# ─── Dev stage (used by docker-compose) ──────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app

# Copy package files first — Docker caches this layer until they change
COPY package*.json ./
RUN npm ci

# Source is mounted as a volume in docker-compose.yml for hot reload
# The COPY below is only used in production builds
COPY . .

EXPOSE 4200

# --host 0.0.0.0 required so the dev server is accessible outside the container
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]

# ─── Production build stage ───────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

# ─── Production serve stage ───────────────────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/dist/lms-frontend/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
