# GamerLand

Aplicación de compra y venta de videojuegos con backend en NestJS y frontend en Vite + TypeScript vanilla modular + Tailwind CSS.

## Qué incluye

- Autenticación con JWT.
- Usuarios normales y administradores.
- Catálogo público de productos.
- CRUD de productos con control por propietario.
- Permisos de administrador para editar o eliminar cualquier producto.
- Registro de compras con detalle e impacto en stock.
- Swagger disponible en `/docs`.
- Frontend base para login, registro, publicación, edición, compra e historial.

## Modelo conectado a Neon

El backend está alineado con estas tablas ya existentes:

- `system_usuarios`
- `productos`
- `compras`
- `compra_detalle`

No se activó `synchronize` en TypeORM para respetar la estructura ya creada en Neon.

## Variables de entorno

### Backend

Copia `.env.example` a `.env` y rellena los valores:

```env
PORT=3000
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
DB_SSL=true
JWT_SECRET=<tu-secreto-aleatorio>
JWT_EXPIRES_IN=7d
```

**¿Cómo genero el `JWT_SECRET`?**

El `JWT_SECRET` es una cadena aleatoria que tú mismo generas — no lo proporciona ningún servicio externo.
Es la clave con la que el servidor firma y verifica todos los tokens de autenticación.
Cada persona que instale el proyecto debe generar el suyo (o acordar uno compartido para el equipo):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y pégalo como valor de `JWT_SECRET` en tu `.env`.

> **Importante:** nunca subas el `.env` real a git. Solo `.env.example` (sin valores reales) debe estar en el repositorio.

### Frontend

Copia `frontend/.env.example` a `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Instalación

```bash
npm install
cd frontend
npm install
```

## Ejecutar el proyecto

Backend:

```bash
npm run start:dev
```

Frontend:

```bash
npm run frontend:dev
```

## Endpoints principales

Base URL del backend: `http://localhost:3000/api`

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /products`
- `GET /products/me`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `POST /purchases`
- `GET /purchases/me`
- `GET /users/me`
- `GET /users` solo admin

Swagger:

```bash
http://localhost:3000/docs
```

## Scripts útiles

Backend:

```bash
npm run build
npm run test
npm run test:e2e
```

Frontend:

```bash
npm run frontend:build
```

## Notas de implementación

- El rol se apoya en `tipo_usuario`: `0` usuario común, `1` administrador.
- Un usuario común solo puede editar o eliminar sus propios productos.
- Un administrador puede editar o eliminar cualquier producto.
- Un usuario no puede comprar sus propios productos.
- Cada compra descuenta stock y genera registros en `compras` y `compra_detalle`.

## Siguiente mejora natural

- Agregar filtros por plataforma, precio y búsqueda.
- Subida real de imágenes a almacenamiento externo.
- Carrito multi-item desde frontend.
- Hashing y políticas más robustas para roles administrativos.
- Tests de integración contra base real o base efímera.
