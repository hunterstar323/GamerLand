import type { AppState, AppView } from '../types.js';
import { escapeHtml, roleLabel } from '../utils.js';

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

function navButton(
  label: string,
  targetView: AppView,
  currentView: AppView,
  options: { right?: boolean } = {},
): string {
  const active = targetView === currentView;

  return `
    <button
      type="button"
      class="${active ? 'bg-amber-300 text-slate-950' : 'bg-white/5 text-slate-100 hover:bg-white/10'} nav-pill ${options.right ? 'ml-auto' : ''}"
      data-action="go-view"
      data-view="${targetView}"
    >
      ${label}
    </button>
  `;
}

export function renderLayout(state: AppState, pageContent: string): string {
  const user = state.session?.user ?? null;

  return `
    <div class="site-bg min-h-screen text-slate-100">
      <main class="relative mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
        <header class="panel p-4 lg:p-6 animate-rise">
          <div class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p class="eyebrow">Ivan Santiago Caiza y Jose David Montero</p>
              <h1 class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                GamerLand Marketplace
              </h1>
              <p class="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Catálogo de venta y compra de productos gamer!!!.
              </p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Estado de sesión</p>
              <p class="mt-2 text-xl font-semibold text-white">${user ? escapeHtml(user.name) : 'Invitado'}</p>
              <p class="mt-1 text-sm text-slate-300">${user ? escapeHtml(roleLabel(user.role)) : 'Inicia sesión para comprar y administrar tu perfil.'}</p>
            </div>
          </div>

          <nav class="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            ${navButton('Catálogo', 'catalog', state.currentView)}
            ${user ? navButton('Mi perfil', 'profile', state.currentView) : ''}
            ${user?.role === '1' ? navButton('Panel admin', 'admin', state.currentView) : ''}
            ${!user ? navButton('Login / Registro', 'auth', state.currentView, { right: true }) : ''}
            ${
              user
                ? '<button type="button" class="nav-pill ml-auto bg-white/5 text-slate-100 hover:bg-white/10" data-action="logout">Cerrar sesión</button>'
                : ''
            }
          </nav>
        </header>

        ${renderNotice(state)}
        ${pageContent}
      </main>
    </div>
  `;
}
