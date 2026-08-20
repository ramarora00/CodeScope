import { auth } from '../auth/firebase';

export async function apiFetch(endpoint, options = {}) {
  const headers = { ...options.headers };

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.error('[apiFetch] Failed to get Firebase token:', e);
    }
  }

  return fetch(endpoint, {
    ...options,
    headers
  });
}
