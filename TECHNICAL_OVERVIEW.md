# GamerLand — Documento Técnico

> Este documento describe la arquitectura, tecnologías, flujo de datos y estructura de archivos del proyecto GamerLand. Está pensado para que cualquier integrante del equipo entienda qué se construyó, por qué se tomaron ciertas decisiones y cómo extenderlo.

---

## 1. ¿Qué es GamerLand?

Es una aplicación web de compra y venta de videojuegos entre usuarios (marketplace C2C).  
Un usuario puede publicar videojuegos a la venta, y otro usuario puede comprarlos.  
Hay dos roles: **usuario normal** y **administrador**.

---

## 2. Stack tecnológico

| Capa       | Tecnología                              | Versión |
|------------|------------------------------------------|---------|
| Backend    | NestJS                                   | 11      |
| ORM        | TypeORM                                  | ~0.3    |
| Base de datos | PostgreSQL serverless (Neon)          | —       |
| Auth       | JWT (passport-jwt) + bcrypt             | —       |
| Docs API   | Swagger (OpenAPI)                        | —       |
| Frontend   | Vite + TypeScript vanilla modular        | 6       |
| CSS        | Tailwind CSS (plugin oficial para Vite)  | 4       |
| Runtime    | Node.js 20+                              | —       |

---

## 3. Estructura de carpetas

```
gamer-land/
├── src/                      ← Código fuente del backend (NestJS)
│   ├── main.ts               ← Punto de entrada, configura CORS, Swagger, ValidationPipe
│   ├── app.module.ts         ← Módulo raíz: importa todos los módulos
│   ├── config/
│   │   └── app.config.ts     ← Lee variables de entorno con @nestjs/config
│   ├── auth/                 ← Módulo de autenticación (login/register/me)
│   ├── users/                ← Módulo de usuarios (entidad + servicio + controller)
│   ├── products/             ← Módulo de productos (CRUD)
│   ├── purchases/            ← Módulo de compras (crear + historial)
│   └── common/
│       ├── decorators/       ← @CurrentUser(), @Roles()
│       ├── enums/            ← UserRole ('0' = user, '1' = admin)
│       ├── guards/           ← JwtAuthGuard, RolesGuard
│       └── interfaces/       ← AuthUser (payload del JWT)
├── frontend/                 ← Código fuente del frontend (Vite + TS + Tailwind)
│   ├── src/
│   │   ├── main.ts           ← Controlador principal de la SPA (routing, eventos)
│   │   ├── api.ts            ← Funciones que llaman al backend (fetch)
│   │   ├── ui.ts             ← Funciones que renderizan HTML en el DOM
│   │   ├── types.ts          ← Interfaces TypeScript (User, Product, Purchase)
│   │   └── config.ts         ← Lee VITE_API_URL desde el .env
│   ├── index.html            ← Shell HTML de la SPA
│   └── vite.config.ts        ← Configura el plugin de Tailwind
├── .env.example              ← Plantilla de variables de entorno del backend
├── .env                      ← Variables reales (NO subir a git)
├── README.md                 ← Guía de instalación y uso
└── TECHNICAL_OVERVIEW.md     ← Este documento
```

---

## 4. Base de datos (Neon — PostgreSQL serverless)

### ¿Qué es Neon?

Neon es una base de datos PostgreSQL alojada en la nube. No requiere instalar nada localmente; se accede mediante una `DATABASE_URL` que incluye host, usuario, contraseña y base de datos. Neon usa *connection pooling* (el dominio termina en `-pooler`).

### Tablas existentes (no se crean, ya existen en Neon)

TypeORM está configurado con `synchronize: false`, es decir, **el backend no crea ni modifica tablas**. Las tablas ya existían en Neon y el código se mapea a ellas.

| Tabla            | Entidad TypeORM | Descripción                         |
|------------------|-----------------|-------------------------------------|
| `system_usuarios`| `User`          | Usuarios registrados                |
| `productos`      | `Product`       | Productos publicados                |
| `compras`        | `Purchase`      | Cabecera de cada compra             |
| `compra_detalle` | `PurchaseDetail`| Líneas de detalle por compra        |

### Relaciones entre entidades

```
User (1) ────< (N) Product        Un usuario puede tener muchos productos
User (1) ────< (N) Purchase       Un usuario puede tener muchas compras
Purchase (1) ──< (N) PurchaseDetail  Una compra tiene uno o varios productos
PurchaseDetail (N) >──── (1) Product  Cada línea de detalle referencia un producto
```

### Columnas clave de la entidad `User`

| Columna DB          | Propiedad TS  | Tipo        | Notas                            |
|---------------------|---------------|-------------|----------------------------------|
| `usuario_id`        | `id`          | number      | PK autoincremental               |
| `nombre`            | `name`        | string      |                                  |
| `correo`            | `email`       | string      | UNIQUE                           |
| `password`          | `password`    | string      | Hash bcrypt, excluido de respuestas |
| `tipo_usuario`      | `role`        | `'0'`/`'1'` | `'0'` = user, `'1'` = admin     |
| `fecha_nacimiento`  | `birthDate`   | date string |                                  |
| `fecha_registro`    | `registeredAt`| date string |                                  |

---

## 5. Autenticación y autorización (JWT)

### ¿Cómo funciona el JWT en este proyecto?

1. El usuario envía `POST /api/auth/register` o `POST /api/auth/login` con email + contraseña.
2. El backend verifica la contraseña usando `bcrypt.compare()`.
3. Si es correcta, genera un **JWT** firmado con `JWT_SECRET` que contiene el payload:
   ```json
   { "sub": 42, "email": "user@mail.com", "role": "0" }
   ```
4. El frontend guarda ese token en `localStorage`.
5. En cada petición protegida, el frontend envía el header:
   ```
   Authorization: Bearer <token>
   ```
6. El `JwtAuthGuard` (NestJS Guard) valida la firma del token y extrae el payload.
7. El decorador `@CurrentUser()` inyecta ese payload en el parámetro del controlador.

### ¿Qué es el JWT_SECRET?

Es una cadena aleatoria que se usa como clave criptográfica para firmar los tokens. Si alguien obtiene este valor, puede generar tokens falsos y suplantar cualquier usuario. Por eso:
- **Nunca debe subirse al repositorio.**
- Cada entorno (dev, producción) debe tener uno diferente.
- Se genera con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Roles

| Valor | Constante       | Permisos                                          |
|-------|-----------------|---------------------------------------------------|
| `'0'` | `UserRole.USER` | Crear/editar/eliminar sus propios productos       |
| `'1'` | `UserRole.ADMIN`| Editar/eliminar cualquier producto de cualquier usuario |

---

## 6. API REST — Endpoints

Base URL: `http://localhost:3000/api`  
Documentación interactiva: `http://localhost:3000/docs` (Swagger)

### Auth

| Método | Ruta           | Auth  | Descripción                    |
|--------|----------------|-------|--------------------------------|
| POST   | `/auth/register` | No  | Registra un nuevo usuario      |
| POST   | `/auth/login`    | No  | Login, devuelve JWT            |
| GET    | `/auth/me`       | JWT | Devuelve el usuario autenticado|

### Products

| Método | Ruta              | Auth  | Descripción                                      |
|--------|-------------------|-------|--------------------------------------------------|
| GET    | `/products`       | No    | Lista todos los productos                        |
| GET    | `/products/me`    | JWT   | Lista mis productos                              |
| GET    | `/products/:id`   | No    | Detalle de un producto                           |
| POST   | `/products`       | JWT   | Crea un producto                                 |
| PUT    | `/products/:id`   | JWT   | Edita un producto (propietario o admin)          |
| DELETE | `/products/:id`   | JWT   | Elimina un producto (propietario o admin)        |

### Purchases

| Método | Ruta             | Auth  | Descripción                          |
|--------|------------------|-------|--------------------------------------|
| POST   | `/purchases`     | JWT   | Registra una compra                  |
| GET    | `/purchases/me`  | JWT   | Historial de compras del usuario     |

---

## 7. Lógica de negocio importante

### Creación de una compra (`POST /purchases`)

La compra acepta un array de ítems `[{ productId, quantity }]`. El servicio:

1. Verifica que no se repitan productos en la misma compra.
2. Carga todos los productos desde BD de una sola vez (`IN` query).
3. Para cada ítem, valida:
   - El producto existe.
   - El comprador **no es el dueño** del producto.
   - Hay suficiente stock (`product.quantity >= item.quantity`).
4. Todo se ejecuta dentro de una **transacción** con `DataSource.transaction()`. Si falla cualquier paso, se hace rollback completo.
5. Descuenta el stock de cada producto.
6. Crea la cabecera `Purchase` y cada `PurchaseDetail`.
7. Calcula el total sumando `price * quantity` de cada ítem.

### Edición/eliminación de producto con permisos

```typescript
// Solo el dueño del producto O un admin puede editar/eliminar
if (product.ownerId !== currentUser.sub && currentUser.role !== UserRole.ADMIN) {
  throw new ForbiddenException('No tienes permiso para modificar este producto.');
}
```

---

## 8. Frontend (Vite + TypeScript + Tailwind)

El frontend es una **SPA (Single Page Application)** sin framework de componentes (sin React/Vue). Usa TypeScript vanilla con módulos ES.

### Módulos

| Archivo      | Responsabilidad                                          |
|--------------|----------------------------------------------------------|
| `config.ts`  | Exporta `API_URL` leído de `import.meta.env.VITE_API_URL`|
| `types.ts`   | Interfaces `User`, `Product`, `Purchase`, `PurchaseDetail`|
| `api.ts`     | Funciones async que hacen `fetch` al backend. Toda la lógica de red está aquí |
| `ui.ts`      | Funciones que generan/inyectan HTML en el DOM. Puras presentación |
| `main.ts`    | Orquestador: inicializa la app, maneja estado de sesión, escucha eventos, llama a `api.ts` y `ui.ts` |

### Flujo de navegación

La SPA usa `localStorage` para guardar el JWT. Al cargar:
1. Si hay token → muestra el catálogo de productos y las opciones autenticadas.
2. Si no hay token → muestra la pantalla de login.

Las "páginas" se simulan mostrando/ocultando secciones del DOM en vez de navegar a otra URL.

### Variables de entorno del frontend

Vite expone las variables `VITE_*` del archivo `.env` dentro del código como `import.meta.env.VITE_*`.  
En producción, se debe crear un `frontend/.env` con la URL real del backend.

---

## 9. Validación de datos

El backend usa `class-validator` y `class-transformer` a través de DTOs (Data Transfer Objects).

Ejemplo del `CreateProductDto`:
```typescript
@IsString() @IsNotEmpty() name: string;
@IsNumber() @Min(0.01) price: number;
@IsInt() @Min(0) quantity: number;
```

La `ValidationPipe` en `main.ts` está configurada con:
- `whitelist: true` → elimina propiedades no declaradas en el DTO.
- `forbidNonWhitelisted: true` → lanza error si llegan propiedades desconocidas.
- `transform: true` → convierte los tipos automáticamente (ej. string `"42"` → number `42`).

---

## 10. Cómo arrancar el proyecto desde cero

### Prerrequisitos

- Node.js 20+
- Una cuenta en [Neon](https://neon.tech) con la base de datos configurada

### Pasos

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd gamer-land

# 2. Instalar dependencias del backend
npm install

# 3. Configurar variables de entorno del backend
cp .env.example .env
# Editar .env con:
#   DATABASE_URL → URL de Neon (Panel: Dashboard → Connection string)
#   JWT_SECRET   → generarlo con:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Instalar dependencias del frontend
cd frontend
npm install

# 5. Configurar variables del frontend
cp .env.example .env
# Editar frontend/.env:
#   VITE_API_URL=http://localhost:3000/api

cd ..

# 6. Arrancar en desarrollo
npm run start:dev       # Backend en http://localhost:3000
# En otra terminal:
cd frontend && npm run dev   # Frontend en http://localhost:5173
```

---

## 11. Tests

```bash
# Tests unitarios (backend)
npm run test

# Tests end-to-end (backend)
npm run test:e2e
```

Los tests están en `src/*.spec.ts` y `test/app.e2e-spec.ts`.  
Actualmente cubren el controlador principal. Se puede extender con tests por módulo.

---

## 12. Decisiones de diseño

| Decisión | Motivo |
|----------|--------|
| `synchronize: false` en TypeORM | Las tablas ya existen en Neon con una estructura definida; sincronizar podría alterar columnas existentes |
| Frontend vanilla (sin React) | Proyecto inicial académico; reduce complejidad de setup y dependencias |
| JWT en localStorage | Simplicidad para un MVP; en producción se debería evaluar `httpOnly cookies` |
| bcrypt con salt 10 | Balance estándar entre seguridad y rendimiento en hash de contraseñas |
| Transacción en compras | Garantiza que el stock y los registros de compra sean siempre consistentes (todo o nada) |
| `import type` para `AuthUser` | TypeScript con `isolatedModules: true` requiere separar imports de tipos para evitar errores de compilación |

---

## 13. Glosario rápido

| Término | Significado |
|---------|-------------|
| JWT | JSON Web Token. Token cifrado que prueba que un usuario está autenticado |
| Guard (NestJS) | Middleware que decide si una petición puede pasar al controlador |
| Decorator | Función que añade comportamiento a clases/métodos en TypeScript |
| DTO | Data Transfer Object. Clase que define la forma de los datos de entrada |
| Entity | Clase que mapea 1:1 con una tabla de la base de datos |
| ORM | Object-Relational Mapper. Permite trabajar con la BD usando objetos TS en vez de SQL puro |
| Pooler | Proxy de conexiones que reutiliza conexiones a la BD para mayor eficiencia |
| SPA | Single Page Application. La app se carga una vez y navega sin recargar la página |


┌─────────────────────────────────────────────────────────────────┐
│                         GAMER LAND FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1️⃣ AUTENTICACIÓN (Auth Flow)
   ├─ Usuario entra a login/registro
   ├─ Frontend: main.ts → form handler → api.login()/api.register()
   ├─ Backend: POST /auth/register o /auth/login
   │  └─ auth.service.ts: Hash password, genera JWT con {sub, email, role, name, birthDate}
   ├─ Frontend: Guarda session en localStorage
   └─ Estado: state.session = { user, token }

2️⃣ CARGA INICIAL (Bootstrap)
   ├─ Frontend: bootstrap() → refrescar datos públicos + privados
   ├─ Llamadas en paralelo:
   │  ├─ api.getProducts({}) → GET /products (sin autenticación)
   │  ├─ api.getCategories() → GET /products/categories (sin autenticación)
   │  └─ Si usuario logueado:
   │     ├─ api.getMyProducts(token) → GET /products/me
   │     ├─ api.getMyPurchases(token) → GET /purchases/me
   │     └─ api.getUsers(token) → GET /users (solo si admin)
   ├─ Backend: ProductsService.findAll() con QueryBuilder
   │  └─ ILIKE :search% si hay filtro de búsqueda
   │  └─ JOIN categorias si hay filtro por categoría
   └─ Frontend: Renderiza state.products, state.categories

3️⃣ CATÁLOGO (Catalog View)
   ├─ Usuario llena búsqueda + filtra por categoría
   ├─ Frontend: form "catalog-search"
   │  ├─ Actualiza state.catalogSearch y state.selectedCategoryId
   │  └─ Llama refreshPublicData() con parámetros
   ├─ API call: api.getProducts({ search: "...", categoryId: 123 })
   │  └─ URL: GET /products?search=prefix%&categoryId=123
   ├─ Backend: ProductsService.buildListQuery()
   │  ├─ WHERE product.name ILIKE 'prefix%' (prefix search, no %prefix%)
   │  ├─ JOIN product_categorias ON category.id = 123
   │  └─ DISTINCT para evitar duplicados
   └─ Frontend: Renderiza catálogo filtrando imagenes si +18 y user es menor

4️⃣ COMPRA DE PRODUCTO (Purchase Flow)
   ├─ Usuario hace clic en "Comprar" en producto +18
   ├─ Frontend: Valida si user >= 18 con canSeeAdultContent()
   │  └─ Si no puede, muestra error y bloquea
   ├─ API call: api.createPurchase({ productId }, token)
   │  └─ POST /purchases con Authorization: Bearer {token}
   ├─ Backend: PurchasesService.create()
   │  ├─ Obtiene user de DB con buyer.birthDate
   │  ├─ Valida isAdult(buyer.birthDate)
   │  ├─ Valida que producto no tiene categorías +18 O user es adult
   │  └─ Crea Purchase + PurchaseDetails
   └─ Frontend: Muestra éxito, recarga datos privados

5️⃣ CREAR/EDITAR PRODUCTO (Product Form en Profile)
   ├─ Usuario llena form en profile-view.ts
   ├─ Frontend: renderCategoryChecks() desactiva categorías +18 si user es menor
   │  └─ <input disabled> + tooltip "(requiere mayoría de edad)"
   ├─ Form submit: "product" → readCategoryIds() + api.createProduct()
   │  └─ POST /products con { name, price, quantity, categoryIds: [1,3] }
   ├─ Backend: ProductsService.create()
   │  ├─ Resuelve todas las categorías (ERROR si no existen)
   │  ├─ Valida assertUserCanUseCategories()
   │  │  └─ Si user es menor Y tiene +18 category → ForbiddenException
   │  └─ Crea Product con relación Many-to-Many a categories
   └─ Frontend: Recarga myProducts, limpia formulario

6️⃣ PANEL ADMIN (Admin View)
   ├─ Si user.role === '1' → acceso a panel
   ├─ Tres tablas editables:
   │  ├─ Categorías (NUEVA):
   │  │  ├─ Edita nombre y swMayoriaEdad (0=General, 1=+18)
   │  │  └─ PUT /products/categories/{id}
   │  ├─ Usuarios:
   │  │  ├─ Edita nombre y rol
   │  │  └─ PUT /users/{id}
   │  └─ Productos:
   │     ├─ Edita nombre, precio, cantidad
   │     └─ PUT /products/{id}
   ├─ Backend: products.service.updateCategory()
   │  ├─ Verifica que user.role === '1' (admin)
   │  ├─ Actualiza category.name y/o swMayoriaEdad
   │  └─ Retorna categoría actualizada
   └─ Frontend: Actualiza state.categories en vivo

7️⃣ ELIMINAR PRODUCTO
   ├─ Usuario hace clic "Eliminar" en Mi perfil o Admin
   ├─ Frontend: Muestra confirm() "¿Estás seguro?"
   ├─ Si confirma:
   │  ├─ API call: api.deleteProduct(id, token)
   │  │  └─ DELETE /products/{id}
   │  ├─ Backend: ProductsService.remove()
   │  │  └─ Verifica que sea owner o admin
   │  └─ Frontend: Recarga productos
   └─ Si cancela: no hace nada