import type { AppState } from './types.js';
import { renderAdminView } from './views/admin-view.js';
import { renderAuthView } from './views/auth-view.js';
import { renderCatalogView } from './views/catalog-view.js';
import { renderLayout } from './views/layout.js';
import { renderProfileView } from './views/profile-view.js';

export function renderApp(state: AppState): string {
  const page =
    state.currentView === 'auth'
      ? renderAuthView(state)
      : state.currentView === 'profile'
        ? renderProfileView(state)
        : state.currentView === 'admin'
          ? renderAdminView(state)
          : renderCatalogView(state);

  return renderLayout(state, page);
}
