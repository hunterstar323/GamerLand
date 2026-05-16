import type { AppState } from '../types.js';
import {
  currency,
  dateFormatter,
  escapeHtml,
  purchaseStatusClass,
  purchaseStatusLabel,
} from '../utils.js';

function renderCategoriesTable(state: AppState): string {
  if (!state.categories.length) {
    return '<p class="empty-state">No hay categorías para mostrar.</p>';
  }

  const rows = state.categories
    .map(
      (category) => `
        <tr class="border-b border-white/10">
          <td class="px-3 py-3 text-slate-200">${category.id}</td>
          <td class="px-3 py-3">
            <input class="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" form="admin-category-${category.id}" name="name" value="${escapeHtml(category.name)}" />
          </td>
          <td class="px-3 py-3">
            <select class="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" form="admin-category-${category.id}" name="swMayoriaEdad">
              <option value="0" ${category.swMayoriaEdad === '0' ? 'selected' : ''}>General</option>
              <option value="1" ${category.swMayoriaEdad === '1' ? 'selected' : ''}>+18</option>
            </select>
          </td>
          <td class="px-3 py-3 text-right">
            <form class="inline-flex gap-2" id="admin-category-${category.id}" data-form="admin-category" data-category-id="${category.id}">
              <button class="ghost-button" type="submit">Guardar</button>
              <button class="danger-button" type="button" data-action="delete-category" data-category-id="${category.id}">Eliminar</button>
            </form>
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35">
      <table class="min-w-full text-sm">
        <thead class="bg-white/5 text-left text-xs uppercase tracking-[0.15em] text-slate-300">
          <tr>
            <th class="px-3 py-3">ID</th>
            <th class="px-3 py-3">Nombre</th>
            <th class="px-3 py-3">Tipo</th>
            <th class="px-3 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderUsersTable(state: AppState): string {
  if (!state.users.length) {
    return '<p class="empty-state">No hay usuarios para mostrar.</p>';
  }

  const currentUserId = state.session?.user.id ?? -1;

  const rows = state.users
    .map(
      (user) => {
        const isCurrentUser = user.id === currentUserId;

        return `
        <tr class="border-b border-white/10">
          <td class="px-3 py-3 text-slate-200">${user.id}</td>
          <td class="px-3 py-3">
            <input class="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" form="admin-user-${user.id}" name="name" value="${escapeHtml(user.name)}" />
          </td>
          <td class="px-3 py-3 text-slate-300">${escapeHtml(user.email)}</td>
          <td class="px-3 py-3">
            <select class="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 ${isCurrentUser ? 'opacity-60 cursor-not-allowed' : ''}" form="admin-user-${user.id}" name="role" ${isCurrentUser ? 'disabled' : ''}>
              <option value="0" ${user.role === '0' ? 'selected' : ''}>Usuario</option>
              <option value="1" ${user.role === '1' ? 'selected' : ''}>Admin</option>
            </select>
            ${isCurrentUser ? '<p class="mt-1 text-[11px] text-amber-300">No puedes cambiar tu propio rol.</p>' : ''}
          </td>
          <td class="px-3 py-3 text-right">
            <form id="admin-user-${user.id}" data-form="admin-user" data-user-id="${user.id}">
              <button class="ghost-button" type="submit">Guardar</button>
            </form>
          </td>
        </tr>
      `;
      },
    )
    .join('');

  return `
    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35">
      <table class="min-w-full text-sm">
        <thead class="bg-white/5 text-left text-xs uppercase tracking-[0.15em] text-slate-300">
          <tr>
            <th class="px-3 py-3">ID</th>
            <th class="px-3 py-3">Nombre</th>
            <th class="px-3 py-3">Correo</th>
            <th class="px-3 py-3">Rol</th>
            <th class="px-3 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderProductsTable(state: AppState): string {
  if (!state.products.length) {
    return '<p class="empty-state">No hay productos para mostrar.</p>';
  }

  const rows = state.products
    .map(
      (product) => `
        <tr class="border-b border-white/10">
          <td class="px-3 py-3 text-slate-200">${product.id}</td>
          <td class="px-3 py-3">
            <input class="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" form="admin-product-${product.id}" name="name" value="${escapeHtml(product.name)}" />
          </td>
          <td class="px-3 py-3">
            <input class="w-28 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" form="admin-product-${product.id}" name="price" type="number" step="0.01" min="0.01" value="${product.price}" />
          </td>
          <td class="px-3 py-3">
            <input class="w-24 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" form="admin-product-${product.id}" name="quantity" type="number" min="0" step="1" value="${product.quantity}" />
          </td>
          <td class="px-3 py-3 text-slate-300">${escapeHtml(product.ownerName)}</td>
          <td class="px-3 py-3 text-right">
            <form class="inline-flex gap-2" id="admin-product-${product.id}" data-form="admin-product" data-product-id="${product.id}">
              <button class="ghost-button" type="submit">Actualizar</button>
              <button class="danger-button" type="button" data-action="delete-product" data-product-id="${product.id}">Eliminar</button>
            </form>
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35">
      <table class="min-w-full text-sm">
        <thead class="bg-white/5 text-left text-xs uppercase tracking-[0.15em] text-slate-300">
          <tr>
            <th class="px-3 py-3">ID</th>
            <th class="px-3 py-3">Nombre</th>
            <th class="px-3 py-3">Precio</th>
            <th class="px-3 py-3">Stock</th>
            <th class="px-3 py-3">Owner</th>
            <th class="px-3 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderPurchasesTable(state: AppState): string {
  if (!state.allPurchases.length) {
    return '<p class="empty-state">No hay compras para mostrar.</p>';
  }

  const rows = state.allPurchases
    .map(
      (purchase) => `
        <tr class="border-b border-white/10">
          <td class="px-3 py-3 text-slate-200">${purchase.id}</td>
          <td class="px-3 py-3 text-slate-300">${escapeHtml(purchase.buyerName)}</td>
          <td class="px-3 py-3 text-slate-300">${dateFormatter.format(new Date(purchase.purchaseDate))}</td>
          <td class="px-3 py-3 text-amber-300">${currency.format(purchase.total)}</td>
          <td class="px-3 py-3">
            <span class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${purchaseStatusClass(purchase.swEstado)}">${purchaseStatusLabel(purchase.swEstado)}</span>
          </td>
          <td class="px-3 py-3 text-right">
            <form class="inline-flex items-center gap-2" data-form="purchase-status" data-purchase-id="${purchase.id}">
              <select class="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" name="swEstado">
                <option value="0" ${purchase.swEstado === '0' ? 'selected' : ''}>Pagado</option>
                <option value="1" ${purchase.swEstado === '1' ? 'selected' : ''}>Entregado</option>
                <option value="2" ${purchase.swEstado === '2' ? 'selected' : ''}>Cancelado</option>
              </select>
              <button class="ghost-button" type="submit">Guardar</button>
            </form>
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35">
      <table class="min-w-full text-sm">
        <thead class="bg-white/5 text-left text-xs uppercase tracking-[0.15em] text-slate-300">
          <tr>
            <th class="px-3 py-3">ID</th>
            <th class="px-3 py-3">Comprador</th>
            <th class="px-3 py-3">Fecha</th>
            <th class="px-3 py-3">Total</th>
            <th class="px-3 py-3">Estado</th>
            <th class="px-3 py-3 text-right">Cambiar estado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function renderAdminView(state: AppState): string {
  const user = state.session?.user;

  if (!user || user.role !== '1') {
    return `
      <section class="panel p-8 animate-rise">
        <h2 class="section-title">Panel de administración</h2>
        <p class="mt-3 text-slate-300">No tienes permisos para esta sección.</p>
      </section>
    `;
  }

  return `
    <section class="panel p-6 lg:p-8 animate-rise">
      <p class="eyebrow">Admin</p>
      <h2 class="section-title">Panel técnico</h2>
      <p class="mt-2 text-sm text-slate-300">Gestiona usuarios y productos con una vista orientada a administración.</p>

      <div class="mt-6 space-y-8">
        <section>
          <h3 class="mb-3 text-lg font-semibold text-white">Categorías</h3>
          <form class="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:grid-cols-[1fr_auto_auto]" data-form="admin-category-create">
            <input
              class="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100"
              name="name"
              placeholder="Nueva categoría"
              maxlength="100"
              required
            />
            <select class="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100" name="swMayoriaEdad" required>
              <option value="0">General</option>
              <option value="1">+18</option>
            </select>
            <button class="primary-button" type="submit">Agregar</button>
          </form>
          ${renderCategoriesTable(state)}
        </section>

        <section>
          <h3 class="mb-3 text-lg font-semibold text-white">Usuarios</h3>
          ${renderUsersTable(state)}
        </section>

        <section>
          <h3 class="mb-3 text-lg font-semibold text-white">Productos</h3>
          ${renderProductsTable(state)}
        </section>

        <section>
          <h3 class="mb-3 text-lg font-semibold text-white">Compras</h3>
          ${renderPurchasesTable(state)}
        </section>
      </div>
    </section>
  `;
}
