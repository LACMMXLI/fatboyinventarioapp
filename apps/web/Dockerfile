# apps/web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Argumento para la URL de la API (provista por Coolify en el build)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Archivos base del monorepo
COPY package*.json ./
COPY tsconfig.base.json ./

# Definiciones de los workspaces necesarios
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Instalación limpia
RUN npm ci

# Código fuente
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build
RUN npm run build -w packages/shared
RUN npm run build -w apps/web

# --------------------------
# Imagen final de Nginx
# --------------------------
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx para React SPA
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build compilado
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
