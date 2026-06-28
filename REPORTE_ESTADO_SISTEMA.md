# Reporte de estado del sistema InventarioApp Fatboy

Fecha: 2026-06-28  
Alcance: revision por codigo y configuracion local del proyecto `C:\inventarioapp`.  
Nota: no se levanto servidor, no se abrio navegador y no se modifico backend ni frontend.

## Resumen ejecutivo

InventarioApp Fatboy es un sistema web para conteo diario de inventario por sucursal. Esta construido como monorepo con backend NestJS, frontend React/Vite y tipos compartidos en `packages/shared`.

Estado general para uso cotidiano: **operable con riesgos pendientes**.

El sistema ya cubre el flujo principal: inicio de sesion, roles, sucursales, catalogo de productos, tiendas/proveedores, captura de conteos, historial y reportes. Para operacion diaria basica de encargados de sucursal, la base funcional esta completa. Los puntos que mas afectan un uso estable en produccion son seguridad de credenciales, migraciones, configuracion de despliegue, permisos finos en algunos endpoints y falta de monitoreo/pruebas automatizadas.

## Como se ve el sistema

La interfaz es mobile-first, oscura, compacta y orientada a captura rapida. Usa fondo oscuro, tarjetas, acento rojo Fatboy, botones grandes y navegacion inferior en movil.

Pantallas principales observadas:

- Login con email y contraseña.
- Registro nuevo con codigo de invitacion para `ADMIN` o `ENCARGADO`.
- Dashboard por rol.
- Captura de conteo por categorias, con botones de sumar/restar y guardado de avance.
- Historial de conteos.
- Panel admin para productos, categorias, sucursales, tiendas, usuarios y reportes.
- Panel de usuarios con codigos de invitacion configurables.

Fortalezas visuales:

- Buena legibilidad en pantallas moviles.
- Controles tactiles grandes para conteo diario.
- Navegacion inferior sencilla por rol.
- Captura por categorias, util para inventario rapido.

Debilidades visuales:

- El tema oscuro puede cansar en uso prolongado o en ambientes con mucha luz.
- El panel admin usa componentes compactos, pero algunas pantallas pueden sentirse apretadas si el catalogo crece mucho.
- Algunos iconos son emojis; funcionan, pero dan menos consistencia profesional que un set de iconos uniforme.
- Falta una vista clara de "estado del sistema" dentro del panel admin.

## Como esta trabajando actualmente

### Backend

Stack:

- NestJS.
- TypeORM.
- PostgreSQL.
- JWT para autenticacion.
- Swagger disponible en `/docs`.
- Prefijo API configurable, por defecto `/api`.

Modulos funcionales:

- Auth: login, perfil, cambio de contraseña, registro por invitacion.
- Users: alta, edicion, activacion/desactivacion de usuarios.
- Branches: sucursales.
- Categories: categorias de productos.
- Product Stores: tiendas/proveedores o agrupacion de productos por tienda.
- Products: catalogo, asignacion a categoria y tienda.
- Counts: conteos de inventario por sucursal.
- Reports: resumen de conteos e historial por producto.

### Frontend

Stack:

- React.
- Vite.
- TypeScript.
- Zustand con persistencia local para sesion.
- Axios para API.
- React Hook Form en login/registro.

Rutas principales:

- `/login`
- `/`
- `/counts/new`
- `/counts/:id`
- `/counts/history`
- `/admin/products`
- `/admin/stores`
- `/admin/categories`
- `/admin/branches`
- `/admin/users`
- `/admin/reports`

### Roles

Roles existentes:

- `ADMIN`: administra catalogo, usuarios, sucursales, reportes y puede operar conteos.
- `ENCARGADO`: realiza conteos de su sucursal.
- `CONSULTA`: todavia existe en codigo para reportes, aunque el registro nuevo se limito a `ADMIN` y `ENCARGADO`.

## Caracteristicas actuales

- Login con JWT.
- Registro de usuarios por codigo de invitacion.
- Dos codigos independientes: administradores y encargados.
- Configuracion de codigos desde panel de usuarios admin.
- Validacion de email y contraseña.
- Usuarios activos/inactivos.
- Encargado obligado a tener sucursal.
- Catalogo inicial desde `productos.md`.
- Sucursales iniciales `Venecia` y `San Marcos`.
- Productos agrupados por categoria.
- Productos asignables a tienda/proveedor.
- Conteo en borrador por sucursal.
- Restriccion para no finalizar conteos vacios.
- Restriccion para no modificar conteos finalizados.
- Historial y reportes de conteos.
- Dockerfile para backend.
- Dockerfile para frontend con Nginx.

## Fallas y riesgos detectados

### Criticos

1. El backend fuerza la clave del admin en cada arranque.

   En `apps/api/src/main.ts`, el usuario `admin@fatboy.com` se crea o se actualiza con contraseña `admin123` cada vez que arranca el backend. Esto ayuda a recuperar acceso, pero en produccion es inseguro porque cualquier reinicio puede devolver la clave a una conocida.

2. `JWT_SECRET` tiene valor por defecto.

   Si no se define `JWT_SECRET`, el sistema usa `default-secret`. En produccion esto permite tokens predecibles si alguien conoce el codigo.

3. CORS permite `*` por defecto.

   Si `CORS_ORIGIN` no se configura, el backend acepta cualquier origen. Para produccion conviene limitarlo al dominio real del frontend.

4. Las migraciones son obligatorias en produccion.

   El backend usa `synchronize: false` cuando `NODE_ENV=production`. Las tablas nuevas, como `invitation_settings`, requieren ejecutar migraciones. Si no se aplican, el registro por invitacion o la configuracion de codigos puede fallar.

### Altos

1. Acceso a detalle de conteo por ID sin filtro de sucursal dentro del servicio.

   El listado filtra a encargados por sucursal, pero `GET /counts/:id` llama a `findById` sin validar que el conteo pertenezca a la sucursal del usuario. Si un usuario autenticado conoce un ID ajeno, podria ver ese conteo.

2. La sesion se persiste en localStorage.

   Es practico para una app interna, pero ante XSS el token queda expuesto. Para una instalacion publica se recomienda hardening adicional.

3. No se observa endpoint de healthcheck.

   Coolify puede levantar el contenedor, pero no necesariamente confirmar que API y base de datos estan respondiendo correctamente.

4. No hay recuperacion formal de contraseña.

   Si el unico admin pierde acceso, hoy la recuperacion depende del reset automatico de `admin123` o intervencion directa en base de datos.

### Medios

1. No hay pruebas automatizadas visibles.

   No se observan tests de auth, permisos, conteos o migraciones. Cada cambio depende de build manual y prueba funcional.

2. El rol `CONSULTA` queda parcialmente vivo.

   Aun aparece en rutas/reportes y tipos, pero ya no se ofrece en registro ni creacion desde el panel de usuarios. Esto puede confundir si no se decide si se conserva o se elimina.

3. Los codigos de invitacion se guardan como texto.

   Funcionan, pero para seguridad seria mejor guardarlos hasheados o tratarlos como secretos.

4. Registro publico depende de codigos estaticos.

   Es simple y suficiente para operacion pequena, pero no hay expiracion, auditoria, uso unico ni invitaciones por empleado.

5. Los reportes son basicos.

   Cubren resumen de conteos e historial por producto, pero no incluyen alertas, diferencias, tendencias, exportacion o comparativos avanzados.

## Estado de salud para uso cotidiano

### Operacion diaria de encargados

Estado: **bueno**.

El flujo de conteo es claro: el encargado entra, abre conteo, captura cantidades, guarda avance y finaliza. El sistema impide cantidades negativas, evita finalizar sin productos y no permite modificar conteos finalizados.

Riesgo principal: si existen muchos productos, la captura por categoria puede volverse lenta sin busqueda rapida, favoritos o productos frecuentes.

### Operacion administrativa

Estado: **funcional**.

El administrador puede gestionar usuarios, sucursales, categorias, productos, tiendas y reportes. El panel ya concentra los codigos de invitacion.

Riesgo principal: la gestion de seguridad esta incompleta para produccion por el reset de clave admin, secretos por defecto y falta de recuperacion formal.

### Despliegue en Coolify

Estado: **usable, pero sensible a configuracion**.

El proyecto tiene Dockerfiles separados para API y Web. El frontend depende de `VITE_API_URL` durante build. El backend depende de `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV` y puerto.

Puntos a revisar en Coolify:

- Backend y frontend deben estar desplegados desde la version correcta.
- `VITE_API_URL` debe apuntar al backend real con `/api` o dejarse compatible con proxy.
- `DATABASE_URL` debe apuntar a la base correcta.
- `JWT_SECRET` debe estar definido y ser fuerte.
- `CORS_ORIGIN` debe apuntar al dominio del frontend.
- Migraciones deben ejecutarse despues del deploy backend.

### Base de datos

Estado: **dependiente de migraciones**.

Entidades principales:

- users
- branches
- product_categories
- product_stores
- products
- inventory_counts
- inventory_count_items
- invitation_settings

Riesgo principal: si produccion no ejecuta migraciones, algunas funciones nuevas no tendran tabla/columnas disponibles.

## Mejoras recomendadas

### Prioridad 1

- Quitar el reset automatico de `admin@fatboy.com / admin123` en cada arranque.
- Crear una recuperacion segura de admin: comando manual, variable temporal o endpoint protegido solo por entorno.
- Exigir `JWT_SECRET` en produccion; fallar el arranque si no existe.
- Configurar `CORS_ORIGIN` con el dominio real.
- Ejecutar y documentar migraciones en Coolify.
- Validar permisos en `GET /counts/:id` para que un encargado no pueda ver conteos de otra sucursal.

### Prioridad 2

- Agregar endpoint `/health` que revise API y conexion a base de datos.
- Agregar pruebas minimas de auth, roles, conteo y registro por invitacion.
- Crear respaldo automatico de PostgreSQL.
- Hashear codigos de invitacion o rotarlos desde admin.
- Agregar bitacora de acciones admin: alta de usuario, cambio de codigo, activacion/desactivacion.

### Prioridad 3

- Busqueda rapida de productos durante conteo.
- Indicador de productos sin capturar por categoria.
- Exportacion de reportes a CSV/PDF.
- Comparativo entre conteos por fecha y sucursal.
- Vista de diferencias o alertas de productos con cambios fuertes.
- Mejorar iconografia con una libreria consistente.
- Modo claro opcional para uso en locales con mucha luz.

## Checklist de uso cotidiano

Antes de usar en operacion diaria:

- Confirmar que el backend responde en `/api`.
- Confirmar que el frontend apunta al backend correcto.
- Iniciar sesion como admin.
- Cambiar/configurar los codigos de invitacion.
- Crear encargados con sucursal asignada.
- Revisar catalogo de productos activo.
- Revisar categorias y tiendas.
- Hacer un conteo de prueba.
- Finalizar conteo de prueba.
- Confirmar que aparece en historial y reportes.
- Confirmar que un encargado solo ve lo que corresponde a su sucursal.

## Diagnostico final

InventarioApp esta en una etapa funcional para operar conteos diarios de inventario. La experiencia principal esta bien enfocada: es rapida, movil y con pocos pasos. El backend tiene reglas utiles para evitar errores basicos de conteo.

El sistema todavia no debe considerarse endurecido para produccion publica sin corregir los puntos de seguridad y despliegue. Para uso interno controlado puede operar, siempre que Coolify este bien configurado, la base tenga migraciones aplicadas y el administrador mantenga control sobre usuarios/codigos.

Estado recomendado: **apto para piloto operativo interno**.  
Estado para produccion estable: **requiere hardening de seguridad, migraciones y monitoreo**.
