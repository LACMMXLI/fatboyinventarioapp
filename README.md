# 🍔 InventarioApp Fatboy

Sistema de conteo de inventario diario para la cadena de comida rápida **Fatboy**.

## Stack Técnico

- **Monorepo** con npm workspaces
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: Vite + React + TypeScript
- **Tipos compartidos**: `packages/shared`

## Prerequisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

## Setup rápido

### 1. Clonar y configurar

```bash
git clone <repo-url> inventarioapp
cd inventarioapp
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL
```

### 2. Crear la base de datos

```sql
CREATE DATABASE inventarioapp;
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar en desarrollo

```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend
npm run dev:web
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs
- Frontend: http://localhost:5173

### 5. Crear usuario administrador

```bash
npm run db:seed
```

Credenciales por defecto:
- **Email**: admin@fatboy.com
- **Password**: admin123

⚠️ **Cambia la contraseña en producción**

## Estructura del proyecto

```
inventarioapp/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Vite + React
├── packages/
│   └── shared/       # Tipos compartidos
├── .env              # Variables de entorno
└── package.json      # Workspace root
```

## Scripts principales

| Script | Descripción |
|--------|------------|
| `npm run dev:api` | Inicia el backend en modo desarrollo |
| `npm run dev:web` | Inicia el frontend en modo desarrollo |
| `npm run db:seed` | Crea el usuario administrador inicial |
| `npm run build` | Construye ambos proyectos |

## Usuarios de prueba

Después de ejecutar el seed:

| Email | Password | Rol |
|-------|----------|-----|
| admin@fatboy.com | admin123 | ADMIN |

Crea más usuarios desde el panel de administración.
