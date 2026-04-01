const API_URL = import.meta.env.VITE_API_URL ?? '';

const NETWORK_ERROR_MESSAGE = 'Не удалось связаться с сервером. Проверьте подключение и попробуйте еще раз.';
const SERVER_ERROR_MESSAGE = 'На сервере произошла ошибка. Попробуйте еще раз чуть позже.';

export function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '' }));
    const message = error.message?.trim();
    if (message) {
      throw new Error(message);
    }

    if (response.status >= 500) {
      throw new Error(SERVER_ERROR_MESSAGE);
    }

    throw new Error('Не удалось выполнить запрос. Проверьте введенные данные и попробуйте еще раз.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}
