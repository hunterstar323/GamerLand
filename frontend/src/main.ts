import './style.css';
import { api } from './api.js';
import { SESSION_STORAGE_KEY } from './config.js';
import type {
  AppState,
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
  myProducts: [],
  purchases: [],
  authMode: 'login',
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

async function refreshPublicData(): Promise<void> {
  state.products = await api.getProducts();
}

async function refreshPrivateData(): Promise<void> {
  if (!state.session) {
    state.myProducts = [];
    state.purchases = [];
    return;
  }

  const [user, myProducts, purchases] = await Promise.all([
    api.me(state.session.token),
    api.getMyProducts(state.session.token),
    api.getMyPurchases(state.session.token),
  ]);

  state.session.user = user;
  state.myProducts = myProducts;
  state.purchases = purchases;
  saveSession(state.session);
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

  if (action === 'logout') {
    state.session = null;
    state.productEditingId = null;
    state.myProducts = [];
    state.purchases = [];
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

  const productId = Number(actionElement.dataset.productId ?? '0');

  if (action === 'edit-product' && productId > 0) {
    state.productEditingId = productId;
    render();
    return;
  }

  if (action === 'delete-product' && productId > 0) {
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
  }
});

root.addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.target;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const formName = form.dataset.form;
  const values = formDataToObject(new FormData(form));

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
  }
});

render();
void bootstrap();
