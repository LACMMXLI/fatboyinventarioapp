# apps/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Archivos base del monorepo
COPY package*.json ./
COPY tsconfig.base.json ./
COPY productos.md ./

# Definiciones de los workspaces necesarios
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Instalación limpia
RUN npm ci

# Código fuente
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

# --------------------------
# Imagen final de producción
# --------------------------
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY productos.md ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Solo dependencias de producción
RUN npm ci --omit=dev

# Copiar artefactos compilados
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start:prod", "-w", "apps/api"]
