import './style.css';
import { api } from './api.js';
import { SESSION_STORAGE_KEY } from './config.js';
import type {
  AppState,
  AppView,
  LoginInput,
  ProductInput,
  RegisterInput,
  Session,
} from './types.js';
import { renderApp } from './ui.js';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('No se encontró el contenedor principal.');
}

const appRoot = root;

const state: AppState = {
  session: loadSession(),
  products: [],
  categories: [],
  myProducts: [],
  purchases: [],
  users: [],
  authMode: 'login',
  currentView: 'catalog',
  catalogSearch: '',
  selectedCategoryId: null,
  productEditingId: null,
  busy: false,
  notice: null,
};

function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

const noticeTimer = { id: 0 };

function setNotice(
  message: string,
  kind: NonNullable<AppState['notice']>['kind'] = 'info',
): void {
  state.notice = { message, kind };
  render();
  window.clearTimeout(noticeTimer.id);
  noticeTimer.id = window.setTimeout(() => {
    state.notice = null;
    render();
  }, 3500);
}

function render(): void {
  appRoot.innerHTML = renderApp(state);
}

function getCatalogFilters() {
  return {
    search: state.catalogSearch,
    categoryId: state.selectedCategoryId,
  };
}

async function refreshPublicData(): Promise<void> {
  const [products, categories] = await Promise.all([
    api.getProducts(getCatalogFilters()),
    api.getCategories(),
  ]);

  state.products = products;
  state.categories = categories;
}

async function refreshPrivateData(): Promise<void> {
  if (!state.session) {
    state.myProducts = [];
    state.purchases = [];
    state.users = [];
    return;
  }

  const session = state.session;
  const [user, myProducts, purchases] = await Promise.all([
    api.me(session.token),
    api.getMyProducts(session.token),
    api.getMyPurchases(session.token),
  ]);

  session.user = user;
  state.myProducts = myProducts;
  state.purchases = purchases;

  if (session.user.role === '1') {
    state.users = await api.getUsers(session.token);
  } else {
    state.users = [];
  }

  saveSession(session);
}

async function bootstrap(): Promise<void> {
  await withBusy(async () => {
    try {
      await refreshPublicData();

      if (state.session) {
        await refreshPrivateData();
      }
    } catch (error) {
      state.session = null;
      saveSession(null);
      setNotice(getErrorMessage(error), 'error');
    }
  });
}

async function withBusy(work: () => Promise<void>): Promise<void> {
  state.busy = true;
  render();

  try {
    await work();
  } finally {
    state.busy = false;
    render();
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
}

function requireSession(): Session {
  if (!state.session) {
    throw new Error('Debes iniciar sesión para realizar esta acción.');
  }

  return state.session;
}

function readCategoryIds(formData: FormData): number[] {
  return [...new Set(formData.getAll('categoryIds').map((value) => Number(value)))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

function goToView(view: AppView): void {
  if (view === 'admin' && state.session?.user.role !== '1') {
    setNotice('No tienes permisos de administrador.', 'error');
    return;
  }

  if ((view === 'profile' || view === 'admin') && !state.session) {
    state.currentView = 'auth';
    render();
    return;
  }

  state.currentView = view;
  render();
}

root.addEventListener('click', async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const actionElement = target.closest<HTMLElement>('[data-action]');

  if (!actionElement) {
    return;
  }

  const action = actionElement.dataset.action;

  if (action === 'show-login') {
    state.authMode = 'login';
    render();
    return;
  }

  if (action === 'show-register') {
    state.authMode = 'register';
    render();
    return;
  }

  if (action === 'go-view') {
    const view = actionElement.dataset.view as AppView | undefined;

    if (view) {
      goToView(view);
    }

    return;
  }

  if (action === 'logout') {
    state.session = null;
    state.currentView = 'catalog';
    state.productEditingId = null;
    state.myProducts = [];
    state.purchases = [];
    state.users = [];
    saveSession(null);
    render();
    setNotice('Sesión cerrada.', 'info');
    return;
  }

  if (action === 'cancel-edit') {
    state.productEditingId = null;
    render();
    return;
  }

  if (action === 'reset-catalog-filters') {
    await withBusy(async () => {
      state.catalogSearch = '';
      state.selectedCategoryId = null;
      await refreshPublicData();
      setNotice('Filtros del catálogo limpiados.', 'info');
    });
    return;
  }

  const productId = Number(actionElement.dataset.productId ?? '0');

  if (action === 'edit-product' && productId > 0) {
    state.productEditingId = productId;
    state.currentView = 'profile';
    render();
    return;
  }

  if (action === 'delete-product' && productId > 0) {
    const confirmed = confirm(
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
    );

    if (!confirmed) {
      return;
    }

    await withBusy(async () => {
      try {
        const session = requireSession();
        await api.deleteProduct(productId, session.token);
        state.productEditingId =
          state.productEditingId === productId ? null : state.productEditingId;
        await refreshPublicData();
        await refreshPrivateData();
        setNotice('Producto eliminado correctamente.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  const categoryId = Number(actionElement.dataset.categoryId ?? '0');

  if (action === 'delete-category' && categoryId > 0) {
    const confirmed = confirm(
      '¿Estás seguro de que deseas eliminar esta categoría? Los productos conservarán su información, pero perderán esta clasificación.',
    );

    if (!confirmed) {
      return;
    }

    await withBusy(async () => {
      try {
        const session = requireSession();
        await api.deleteCategory(categoryId, session.token);
        await refreshPublicData();

        if (state.session) {
          await refreshPrivateData();
        }

        setNotice('Categoría eliminada correctamente.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
  }
});

root.addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.target;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const formName = form.dataset.form;
  const formData = new FormData(form);
  const values = formDataToObject(formData);

  if (formName === 'catalog-search') {
    await withBusy(async () => {
      state.catalogSearch = values.search ?? '';
      state.selectedCategoryId = values.categoryId ? Number(values.categoryId) : null;
      await refreshPublicData();
    });
    return;
  }

  if (formName === 'login') {
    await withBusy(async () => {
      try {
        const payload: LoginInput = {
          email: values.email,
          password: values.password,
        };

        const auth = await api.login(payload);
        state.session = { token: auth.accessToken, user: auth.user };
        saveSession(state.session);
        state.currentView = 'catalog';
        await refreshPublicData();
        await refreshPrivateData();
        setNotice('Sesión iniciada correctamente.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'register') {
    await withBusy(async () => {
      try {
        const payload: RegisterInput = {
          name: values.name,
          email: values.email,
          password: values.password,
          birthDate: values.birthDate || undefined,
        };

        const auth = await api.register(payload);
        state.session = { token: auth.accessToken, user: auth.user };
        saveSession(state.session);
        state.currentView = 'catalog';
        await refreshPublicData();
        await refreshPrivateData();
        setNotice('Cuenta creada correctamente.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'product') {
    await withBusy(async () => {
      try {
        const session = requireSession();
        const payload: ProductInput = {
          name: values.name,
          description: values.description || undefined,
          price: Number(values.price),
          quantity: Number(values.quantity),
          image: values.image || undefined,
          categoryIds: readCategoryIds(formData),
        };

        if (state.productEditingId) {
          await api.updateProduct(state.productEditingId, payload, session.token);
          setNotice('Producto actualizado correctamente.', 'success');
        } else {
          await api.createProduct(payload, session.token);
          setNotice('Producto publicado correctamente.', 'success');
        }

        state.productEditingId = null;
        form.reset();
        await refreshPublicData();
        await refreshPrivateData();
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'purchase') {
    await withBusy(async () => {
      try {
        const session = requireSession();
        const productId = Number(form.dataset.productId ?? '0');
        const quantity = Number(values.quantity);

        await api.createPurchase(
          {
            items: [{ productId, quantity }],
          },
          session.token,
        );

        await refreshPublicData();
        await refreshPrivateData();
        setNotice('Compra registrada correctamente.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'admin-user') {
    await withBusy(async () => {
      try {
        const session = requireSession();
        const userId = Number(form.dataset.userId ?? '0');

        const payload: { name?: string; role?: '0' | '1' } = {
          name: values.name,
        };

        if (values.role === '0' || values.role === '1') {
          payload.role = values.role;
        }

        await api.updateUserByAdmin(
          userId,
          payload,
          session.token,
        );

        await refreshPrivateData();
        setNotice('Usuario actualizado.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'admin-product') {
    await withBusy(async () => {
      try {
        const session = requireSession();
        const productId = Number(form.dataset.productId ?? '0');

        await api.updateProduct(
          productId,
          {
            name: values.name,
            price: Number(values.price),
            quantity: Number(values.quantity),
          },
          session.token,
        );

        await refreshPublicData();
        await refreshPrivateData();
        setNotice('Producto actualizado desde panel admin.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'admin-category') {
    await withBusy(async () => {
      try {
        const session = requireSession();
        const categoryId = Number(form.dataset.categoryId ?? '0');

        await api.updateCategory(
          categoryId,
          {
            name: values.name,
            swMayoriaEdad: values.swMayoriaEdad as '0' | '1',
          },
          session.token,
        );

        await refreshPublicData();
        setNotice('Categoría actualizada.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
    return;
  }

  if (formName === 'admin-category-create') {
    await withBusy(async () => {
      try {
        const session = requireSession();

        await api.createCategory(
          {
            name: values.name,
            swMayoriaEdad: values.swMayoriaEdad as '0' | '1',
          },
          session.token,
        );

        form.reset();
        await refreshPublicData();
        setNotice('Categoría creada correctamente.', 'success');
      } catch (error) {
        setNotice(getErrorMessage(error), 'error');
      }
    });
  }
});

render();
void bootstrap();
