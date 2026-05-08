import type { AppState, Product, Purchase } from './types.js';

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function roleLabel(role: '0' | '1'): string {
  return role === '1' ? 'Administrador' : 'Jugador vendedor';
}

function renderNotice(state: AppState): string {
  if (!state.notice) {
    return '';
  }

  const palette = {
    success: 'border-emerald-300/70 bg-emerald-400/10 text-emerald-100',
    error: 'border-rose-300/70 bg-rose-400/10 text-rose-100',
    info: 'border-sky-300/70 bg-sky-400/10 text-sky-100',
  };

  return `
    <div class="rounded-2xl border px-4 py-3 text-sm shadow-lg ${palette[state.notice.kind]}">
      ${escapeHtml(state.notice.message)}
    </div>
  `;
}

function renderAuthPanel(state: AppState): string {
  const isLogin = state.authMode === 'login';

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <p class="eyebrow">Acceso</p>
          <h2 class="section-title">${isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
        </div>
        <div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          <button type="button" class="rounded-full px-4 py-2 ${isLogin ? 'bg-amber-300 text-slate-950' : 'text-slate-200'}" data-action="show-login">Login</button>
          <button type="button" class="rounded-full px-4 py-2 ${!isLogin ? 'bg-amber-300 text-slate-950' : 'text-slate-200'}" data-action="show-register">Registro</button>
        </div>
      </div>

      ${
        isLogin
          ? `
            <form class="grid gap-4" data-form="login">
              <label class="field">
                <span>Correo</span>
                <input name="email" type="email" placeholder="correo@ejemplo.com" required />
              </label>
              <label class="field">
                <span>Contraseña</span>
                <input name="password" type="password" placeholder="Mínimo 6 caracteres" required minlength="6" />
              </label>
              <button class="primary-button" type="submit">Entrar al marketplace</button>
            </form>
          `
          : `
            <form class="grid gap-4" data-form="register">
              <label class="field">
                <span>Nombre visible</span>
                <input name="name" type="text" placeholder="Tu alias gamer" required />
              </label>
              <label class="field">
                <span>Correo</span>
                <input name="email" type="email" placeholder="correo@ejemplo.com" required />
              </label>
              <label class="field">
                <span>Fecha de nacimiento</span>
                <input name="birthDate" type="date" />
              </label>
              <label class="field">
                <span>Contraseña</span>
                <input name="password" type="password" placeholder="Mínimo 6 caracteres" required minlength="6" />
              </label>
              <button class="primary-button" type="submit">Crear cuenta y vender</button>
            </form>
          `
      }
    </section>
  `;
}

function renderDashboard(state: AppState): string {
  if (!state.session) {
    return renderAuthPanel(state);
  }

  const user = state.session.user;
  const totalInventory = state.myProducts.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="eyebrow">Panel</p>
          <h2 class="section-title">Hola, ${escapeHtml(user.name)}</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-300">
            ${roleLabel(user.role)} con acceso a catálogo, publicaciones y compras.
          </p>
        </div>
        <button type="button" class="ghost-button" data-action="logout">Cerrar sesión</button>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <article class="stat-card">
          <span>Publicaciones tuyas</span>
          <strong>${state.myProducts.length}</strong>
        </article>
        <article class="stat-card">
          <span>Unidades en stock</span>
          <strong>${totalInventory}</strong>
        </article>
        <article class="stat-card">
          <span>Compras realizadas</span>
          <strong>${state.purchases.length}</strong>
        </article>
      </div>
    </section>
  `;
}

function renderProductForm(state: AppState): string {
  if (!state.session) {
    return '';
  }

  const editingProduct = state.productEditingId
    ? state.products.find((product) => product.id === state.productEditingId) ?? null
    : null;

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <p class="eyebrow">Vender</p>
          <h2 class="section-title">${editingProduct ? 'Editar publicación' : 'Publicar videojuego'}</h2>
        </div>
        ${
          editingProduct
            ? '<button type="button" class="ghost-button" data-action="cancel-edit">Cancelar edición</button>'
            : ''
        }
      </div>
      <form class="grid gap-4 md:grid-cols-2" data-form="product">
        <label class="field md:col-span-2">
          <span>Título</span>
          <input name="name" type="text" required value="${escapeHtml(editingProduct?.name ?? '')}" placeholder="Ej. The Legend of Zelda: Tears of the Kingdom" />
        </label>
        <label class="field md:col-span-2">
          <span>Descripción</span>
          <textarea name="description" rows="4" placeholder="Estado del juego, plataforma, edición, observaciones">${escapeHtml(editingProduct?.description ?? '')}</textarea>
        </label>
        <label class="field">
          <span>Precio</span>
          <input name="price" type="number" min="0.01" step="0.01" required value="${editingProduct?.price ?? ''}" />
        </label>
        <label class="field">
          <span>Cantidad</span>
          <input name="quantity" type="number" min="0" step="1" required value="${editingProduct?.quantity ?? ''}" />
        </label>
        <label class="field md:col-span-2">
          <span>URL de imagen</span>
          <input name="image" type="url" value="${escapeHtml(editingProduct?.image ?? '')}" placeholder="https://..." />
        </label>
        <button class="primary-button md:col-span-2" type="submit">
          ${editingProduct ? 'Guardar cambios' : 'Publicar producto'}
        </button>
      </form>
    </section>
  `;
}

function renderProductCard(product: Product, state: AppState): string {
  const user = state.session?.user;
  const isOwner = user?.id === product.ownerId;
  const isAdmin = user?.role === '1';
  const canManage = Boolean(user && (isOwner || isAdmin));
  const canBuy = Boolean(user && !isOwner && product.quantity > 0);
  const cover =
    product.image ||
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80';

  return `
    <article class="product-card animate-rise">
      <div class="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/40">
        <img class="h-48 w-full object-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(product.name)}" />
        <div class="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-xs uppercase tracking-[0.2em] text-white/80">
          <span class="rounded-full bg-slate-950/70 px-3 py-1">${escapeHtml(product.ownerName)}</span>
          <span class="rounded-full bg-amber-300 px-3 py-1 text-slate-950">${product.quantity} und.</span>
        </div>
      </div>
      <div class="mt-4 flex h-full flex-col">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-white">${escapeHtml(product.name)}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-300">
            ${escapeHtml(product.description ?? 'Sin descripción adicional.')}
          </p>
        </div>
        <div class="mt-auto space-y-4">
          <div class="flex items-center justify-between text-sm text-slate-300">
            <span>Precio</span>
            <strong class="text-xl text-amber-300">${currency.format(product.price)}</strong>
          </div>
          ${
            canBuy
              ? `
                <form class="flex items-center gap-3" data-form="purchase" data-product-id="${product.id}">
                  <input class="qty-input" name="quantity" type="number" min="1" max="${product.quantity}" value="1" required />
                  <button class="primary-button flex-1" type="submit">Comprar</button>
                </form>
              `
              : ''
          }
          ${
            !user
              ? '<p class="text-sm text-slate-400">Inicia sesión para comprar o publicar.</p>'
              : ''
          }
          ${
            isOwner
              ? '<p class="text-sm text-emerald-300">Esta publicación es tuya.</p>'
              : ''
          }
          ${
            canManage
              ? `
                <div class="flex gap-3">
                  <button type="button" class="ghost-button flex-1" data-action="edit-product" data-product-id="${product.id}">Editar</button>
                  <button type="button" class="danger-button flex-1" data-action="delete-product" data-product-id="${product.id}">Eliminar</button>
                </div>
              `
              : ''
          }
        </div>
      </div>
    </article>
  `;
}

function renderCatalog(state: AppState): string {
  const cards = state.products.length
    ? state.products.map((product) => renderProductCard(product, state)).join('')
    : '<p class="empty-state">Todavía no hay productos publicados.</p>';

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="eyebrow">Catálogo</p>
          <h2 class="section-title">Videojuegos disponibles</h2>
        </div>
        <p class="text-sm text-slate-300">${state.products.length} publicaciones activas</p>
      </div>
      <div class="grid gap-5 lg:grid-cols-3">${cards}</div>
    </section>
  `;
}

function renderPurchaseCard(purchase: Purchase): string {
  const items = purchase.items
    .map(
      (item) => `
        <li class="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-medium text-white">${escapeHtml(item.product.name)}</p>
              <p class="text-sm text-slate-400">${item.quantity} unidad(es)</p>
            </div>
            <span class="text-sm font-semibold text-amber-300">${currency.format(item.unitPrice)}</span>
          </div>
        </li>
      `,
    )
    .join('');

  return `
    <article class="panel p-5 animate-rise">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm uppercase tracking-[0.2em] text-slate-400">Orden #${purchase.id}</p>
          <h3 class="text-lg font-semibold text-white">${dateFormatter.format(new Date(purchase.purchaseDate))}</h3>
        </div>
        <strong class="text-xl text-amber-300">${currency.format(purchase.total)}</strong>
      </div>
      <ul class="space-y-3">${items}</ul>
    </article>
  `;
}

function renderPurchases(state: AppState): string {
  if (!state.session) {
    return '';
  }

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <p class="eyebrow">Compras</p>
          <h2 class="section-title">Tu historial</h2>
        </div>
      </div>
      <div class="grid gap-4">
        ${
          state.purchases.length
            ? state.purchases.map((purchase) => renderPurchaseCard(purchase)).join('')
            : '<p class="empty-state">Todavía no has realizado compras.</p>'
        }
      </div>
    </section>
  `;
}

export function renderApp(state: AppState): string {
  const user = state.session?.user;

  return `
    <div class="min-h-screen bg-[radial-gradient(circle_at_top,#12324a_0%,#08111c_40%,#05080f_100%)] text-slate-100">
      <div class="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,184,77,0.12),transparent_30%,rgba(56,189,248,0.08)_75%,transparent)]"></div>
      <main class="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <header class="panel overflow-hidden p-6 lg:p-8 animate-rise">
          <div class="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <p class="eyebrow">Marketplace gamer</p>
              <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">Compra, vende y administra tu catálogo en GamerLand.</h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Backend Nest con autenticación JWT, permisos por propietario y administrador, catálogo compartido y compras conectadas a Neon.
              </p>
              <div class="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span class="tag">Swagger</span>
                <span class="tag">Nest + PostgreSQL</span>
                <span class="tag">Vite + TypeScript</span>
                <span class="tag">Tailwind CSS</span>
              </div>
            </div>
            <div class="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 backdrop-blur-sm">
              <div class="flex items-center justify-between">
                <span class="text-sm uppercase tracking-[0.2em] text-slate-400">Estado</span>
                <span class="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">${state.busy ? 'Sincronizando' : 'Listo'}</span>
              </div>
              <div>
                <p class="text-sm text-slate-400">Sesión actual</p>
                <p class="mt-1 text-xl font-semibold text-white">${user ? escapeHtml(user.email) : 'Invitado'}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400">Documentación API</p>
                <a class="mt-1 inline-flex text-amber-300 underline decoration-amber-300/40 underline-offset-4" href="http://localhost:3000/docs" target="_blank" rel="noreferrer">Abrir Swagger</a>
              </div>
            </div>
          </div>
        </header>

        ${renderNotice(state)}
        ${renderDashboard(state)}
        ${renderProductForm(state)}
        ${renderPurchases(state)}
        ${renderCatalog(state)}
      </main>
    </div>
  `;
}
