# Stage 1: Build Angular app
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* package-lock.json* yarn.lock* ./

# Install dependencies — supports pnpm, npm, and yarn
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    else \
      npm install; \
    fi

# Copy remaining source
COPY . .

# Build Angular app (outputPath: dist/opsflow-web -> dist/opsflow-web/browser)
RUN npm run build

# Stage 2: Serve with nginx (SPA only, no /api proxy — split deploy Vercel + Render)
FROM nginx:alpine
COPY --from=build /app/dist/opsflow-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
