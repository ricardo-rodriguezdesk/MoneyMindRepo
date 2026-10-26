// En desarrollo se usa el proxy de Vite (/api); en Vercel se define VITE_API_URL con la URL del backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'moneymind_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Llamada a la API. Lanza un Error con { status, message, errors } si la respuesta no es 2xx. */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error('No pudimos conectar, intenta de nuevo');
    err.status = 0;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message ?? 'Ocurrió un error, intenta de nuevo');
    err.status = res.status;
    err.errors = data.errors ?? {};
    throw err;
  }
  return data;
}
