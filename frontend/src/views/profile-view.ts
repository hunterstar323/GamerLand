import type { AppState, Product, Purchase } from '../types.js';
import { canSeeAdultContent, currency, dateFormatter, escapeHtml, roleLabel } from '../utils.js';

function renderCategoryChecks(state: AppState, selectedIds: number[]): string {
  if (!state.categories.length) {
    return '<p class="text-sm text-slate-400">No hay categorías disponibles.</p>';
  }

  const userIsAdult = canSeeAdultContent(state.session?.user ?? null);

  return state.categories
    .map((category) => {
      const checked = selectedIds.includes(category.id);
      const isAdultCategory = category.swMayoriaEdad === '1';
      const isDisabled = isAdultCategory && !userIsAdult;

      return `
        <label class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-100'}">
          <input type="checkbox" name="categoryIds" value="${category.id}" ${checked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} />
          <span>${escapeHtml(category.name)}${isAdultCategory ? ' +18' : ''}${isDisabled ? ' (requiere mayoría de edad)' : ''}</span>
        </label>
      `;
    })
    .join('');
}

function renderProductEditor(state: AppState): string {
  const editingProduct = state.productEditingId
    ? state.myProducts.find((product) => product.id === state.productEditingId) ?? null
    : null;

  const selectedIds = editingProduct
    ? editingProduct.categories.map((category) => category.id)
    : [];

  return `
    <section class="panel p-6 animate-rise">
      <div class="mb-5 flex items-center justify-between gap-4">
        <div>
          <p class="eyebrow">Publicaciones</p>
          <h3 class="section-title">${editingProduct ? 'Editar producto' : 'Publicar producto'}</h3>
        </div>
        ${editingProduct ? '<button type="button" class="ghost-button" data-action="cancel-edit">Cancelar</button>' : ''}
      </div>

      <form class="grid gap-4 md:grid-cols-2" data-form="product">
        <label class="field md:col-span-2">
          <span>Título</span>
          <input name="name" type="text" required value="${escapeHtml(editingProduct?.name ?? '')}" />
        </label>
        <label class="field md:col-span-2">
          <span>Descripción</span>
          <textarea name="description" rows="4">${escapeHtml(editingProduct?.description ?? '')}</textarea>
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
          <span>Imagen URL</span>
          <input name="image" type="url" value="${escapeHtml(editingProduct?.image ?? '')}" />
        </label>
        <div class="field md:col-span-2">
          <span>Categorías</span>
          <div class="flex flex-wrap gap-2">${renderCategoryChecks(state, selectedIds)}</div>
        </div>
        <button class="primary-button md:col-span-2" type="submit">${editingProduct ? 'Guardar cambios' : 'Publicar'}</button>
      </form>
    </section>
  `;
}

function renderMyProductCard(product: Product): string {
  const categories = product.categories.length
    ? product.categories
        .map((category) => `<span class="tag text-xs">${escapeHtml(category.name)}</span>`)
        .join('')
    : '<span class="text-xs text-slate-400">Sin categoría</span>';

  return `
    <article class="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h4 class="text-base font-semibold text-white">${escapeHtml(product.name)}</h4>
          <p class="mt-1 text-sm text-slate-300">${escapeHtml(product.description ?? 'Sin descripción.')}</p>
        </div>
        <strong class="text-lg text-amber-300">${currency.format(product.price)}</strong>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">${categories}</div>
      <div class="mt-4 flex items-center justify-between">
        <span class="text-sm text-slate-300">Stock: ${product.quantity}</span>
        <div class="flex gap-2">
          <button type="button" class="ghost-button" data-action="edit-product" data-product-id="${product.id}">Editar</button>
          <button type="button" class="danger-button" data-action="delete-product" data-product-id="${product.id}">Eliminar</button>
        </div>
      </div>
    </article>
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
    <article class="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div class="mb-3 flex items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Orden #${purchase.id}</p>
          <p class="text-sm text-slate-200">${dateFormatter.format(new Date(purchase.purchaseDate))}</p>
        </div>
        <strong class="text-lg text-amber-300">${currency.format(purchase.total)}</strong>
      </div>
      <ul class="space-y-2">${items}</ul>
    </article>
  `;
}

export function renderProfileView(state: AppState): string {
  const user = state.session?.user;

  if (!user) {
    return `
      <section class="panel p-8 animate-rise">
        <h2 class="section-title">Perfil</h2>
        <p class="mt-3 text-slate-300">Necesitas iniciar sesión para ver tu perfil.</p>
        <button type="button" class="primary-button mt-6" data-action="go-view" data-view="auth">Ir a login</button>
      </section>
    `;
  }

  const productsHtml = state.myProducts.length
    ? state.myProducts.map(renderMyProductCard).join('')
    : '<p class="empty-state">Aún no has publicado productos.</p>';

  const purchasesHtml = state.purchases.length
    ? state.purchases.map(renderPurchaseCard).join('')
    : '<p class="empty-state">Aún no has realizado compras.</p>';

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p class="eyebrow">Mi perfil</p>
          <h2 class="section-title">${escapeHtml(user.name)}</h2>
          <p class="mt-2 text-sm text-slate-300">${escapeHtml(user.email)} | ${escapeHtml(roleLabel(user.role))}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Mis productos</h3>
          ${productsHtml}
        </div>
        ${renderProductEditor(state)}
      </div>

      <div class="mt-8">
        <h3 class="mb-4 text-xl font-semibold text-white">Historial de compras</h3>
        <div class="grid gap-3 lg:grid-cols-2">${purchasesHtml}</div>
      </div>
    </section>
  `;
}
