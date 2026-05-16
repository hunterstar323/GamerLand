import type { AppState } from '../types.js';

export function renderAuthView(state: AppState): string {
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
            <form class="grid max-w-2xl gap-4" data-form="login">
              <label class="field">
                <span>Correo</span>
                <input name="email" type="email" placeholder="correo@ejemplo.com" required />
              </label>
              <label class="field">
                <span>Contraseña</span>
                <input name="password" type="password" placeholder="Mínimo 6 caracteres" required minlength="6" />
              </label>
              <button class="primary-button" type="submit">Entrar</button>
            </form>
          `
          : `
            <form class="grid max-w-2xl gap-4" data-form="register">
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
              <button class="primary-button" type="submit">Crear cuenta</button>
            </form>
          `
      }
    </section>
  `;
}
