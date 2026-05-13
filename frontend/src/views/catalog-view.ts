import type { AppState, Product } from '../types.js';
import { canSeeAdultContent, currency, escapeHtml } from '../utils.js';

function renderCategoryOptions(state: AppState): string {
  const options = state.categories
    .map(
      (category) =>
        `<option value="${category.id}" ${state.selectedCategoryId === category.id ? 'selected' : ''}>${escapeHtml(category.name)}${category.swMayoriaEdad === '1' ? ' (+18)' : ''}</option>`,
    )
    .join('');

  return `<option value="">Todas las categorías</option>${options}`;
}

function renderProductCard(product: Product, state: AppState): string {
  const user = state.session?.user ?? null;
  const isOwner = user?.id === product.ownerId;
  const showAdultMedia = !product.isAdultOnly || canSeeAdultContent(user);
  const canBuy = Boolean(user && !isOwner && product.quantity > 0 && showAdultMedia);
  const cover =
    product.image ||
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80';

  const categories = product.categories.length
    ? product.categories
        .map(
          (category) =>
            `<span class="tag text-xs">${escapeHtml(category.name)}${category.swMayoriaEdad === '1' ? ' +18' : ''}</span>`,
        )
        .join('')
    : '<span class="text-xs text-slate-400">Sin categoría</span>';

  return `
    <article class="product-card animate-rise">
      <div class="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/40">
        <img class="h-52 w-full object-cover ${showAdultMedia ? '' : 'blur-md'}" src="${escapeHtml(cover)}" alt="${escapeHtml(product.name)}" />
        <div class="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-xs uppercase tracking-[0.2em] text-white/80">
          <span class="rounded-full bg-slate-950/75 px-3 py-1">${escapeHtml(product.ownerName)}</span>
          <span class="rounded-full bg-amber-300 px-3 py-1 text-slate-950">${product.quantity} und.</span>
        </div>
      </div>

      <div class="mt-4 flex h-full flex-col">
        <div>
          <h3 class="text-lg font-semibold text-white">${escapeHtml(product.name)}</h3>
          <p class="mt-2 text-sm text-slate-300">${escapeHtml(product.description ?? 'Sin descripción adicional.')}</p>
          <div class="mt-3 flex flex-wrap gap-2">${categories}</div>
        </div>

        <div class="mt-auto space-y-3 pt-4">
          <div class="flex items-center justify-between text-sm text-slate-300">
            <span>Precio</span>
            <strong class="text-xl text-amber-300">${currency.format(product.price)}</strong>
          </div>

          ${
            canBuy
              ? `<form class="flex items-center gap-2" data-form="purchase" data-product-id="${product.id}">
                  <input class="qty-input" name="quantity" type="number" min="1" max="${product.quantity}" value="1" required />
                  <button class="primary-button flex-1" type="submit">Comprar</button>
                </form>`
              : ''
          }

          ${!state.session ? '<p class="text-sm text-slate-400">Inicia sesión para comprar productos.</p>' : ''}
          ${
            product.isAdultOnly && !showAdultMedia
              ? '<p class="text-sm text-amber-200">Contenido +18 oculto para invitados o menores de edad.</p>'
              : ''
          }
          ${isOwner ? '<p class="text-sm text-emerald-300">Este producto te pertenece.</p>' : ''}
        </div>
      </div>
    </article>
  `;
}

export function renderCatalogView(state: AppState): string {
  const cards = state.products.length
    ? state.products.map((product) => renderProductCard(product, state)).join('')
    : '<p class="empty-state">No hay productos que coincidan con la búsqueda/filtro.</p>';

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p class="eyebrow">Catálogo</p>
          <h2 class="section-title">Explora videojuegos publicados</h2>
          <p class="mt-2 text-sm text-slate-300">Búsqueda por prefijo con ILIKE term% y filtro por categoría.</p>
        </div>
        <p class="text-sm text-slate-300">${state.products.length} resultados</p>
      </div>

      <form class="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_auto]" data-form="catalog-search">
        <label class="field">
          <span>Buscar por nombre</span>
          <input name="search" type="text" placeholder="Ej. Mario" value="${escapeHtml(state.catalogSearch)}" />
        </label>
        <label class="field">
          <span>Categoría</span>
          <select class="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none" name="categoryId">
            ${renderCategoryOptions(state)}
          </select>
        </label>
        <div class="flex items-end gap-2">
          <button class="primary-button w-full" type="submit">Aplicar</button>
          <button class="ghost-button" type="button" data-action="reset-catalog-filters">Limpiar</button>
        </div>
      </form>

      <div class="grid gap-5 lg:grid-cols-3">${cards}</div>
    </section>
  `;
}
