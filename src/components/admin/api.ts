'use client';

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)venly_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };
  if (init.body && typeof init.body === 'string') headers['Content-Type'] = 'application/json';
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) headers['x-csrf-token'] = getCsrfToken();
  const res = await fetch(path, { ...init, method, headers, credentials: 'same-origin', cache: 'no-store' });
  let json: { ok?: boolean; data?: T; error?: string; fields?: Record<string, string> } = {};
  try { json = await res.json(); } catch { /* empty response */ }
  if (!res.ok || json.ok === false) {
    const error = new Error(json.error || `Erro ${res.status}`) as Error & { fields?: Record<string, string>; status?: number };
    error.fields = json.fields;
    error.status = res.status;
    throw error;
  }
  return json.data as T;
}
