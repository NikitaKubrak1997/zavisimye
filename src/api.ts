const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getInitDataRaw() {
  return (window as Window & { Telegram?: any }).Telegram?.WebApp?.initData ?? '';
}

export async function authorizedFetch(path: string, init?: RequestInit) {
  const initDataRaw = getInitDataRaw();

  if (!initDataRaw) {
    throw new Error('Telegram initData is missing. Open app from Telegram client.');
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `tma ${initDataRaw}`);

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
}

export async function validateSession() {
  const response = await authorizedFetch('/api/session/validate', { method: 'POST' });

  if (!response.ok) {
    throw new Error(`Validation failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true; user: { first_name?: string } }>;
}
