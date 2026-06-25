# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Frontend — Dockerfile (Multi-Stage)
# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Build  — node:22-alpine (npm ci + npm run build)
# Stage 2: Runtime — nginx:alpine (serves built SPA, proxies /api/)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (TypeScript/Vite/Tailwind are devDependencies needed for build)
RUN npm ci --no-audit --no-fund

# Copy all sources and build
COPY . .

# Default API URL for production (relative — proxied by nginx to backend)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Stage 2: Runtime with Nginx ─────────────────────────────────────────
FROM nginx:alpine

# Create non-root user for nginx worker (master still runs as root for port 80)
# The nginx:alpine image already has an 'nginx' user — we use it for the workers
# via the nginx.conf 'user nginx;' directive.

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built SPA
COPY --from=build /app/dist /usr/share/nginx/html

# Copy production nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx logs to stdout/stderr (already default for Docker)
# Switch user for security context
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
