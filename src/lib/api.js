// Connection details live in localStorage so the dashboard reconnects on reload.
// The admin key is the only secret; the name is attribution for the audit log.
const KEYS = { url: 'alocks_url', key: 'alocks_key', actor: 'alocks_actor' }

export function loadConnection() {
  try {
    const url = localStorage.getItem(KEYS.url)
    const key = localStorage.getItem(KEYS.key)
    const actor = localStorage.getItem(KEYS.actor)
    return url && key && actor ? { url, key, actor } : { url: url || '', key: key || '', actor: actor || '' }
  } catch {
    return { url: '', key: '', actor: '' }
  }
}

export function saveConnection({ url, key, actor }) {
  try {
    localStorage.setItem(KEYS.url, url)
    localStorage.setItem(KEYS.key, key)
    localStorage.setItem(KEYS.actor, actor)
  } catch { /* private window: stays connected for this tab only */ }
}

export function clearConnection() {
  try {
    localStorage.removeItem(KEYS.key)
  } catch { /* ignore */ }
}

let conn = loadConnection()
export const setConnection = (c) => { conn = c }
export const currentActor = () => conn.actor

export class ApiError extends Error {
  constructor(status, detail) {
    const message = typeof detail === 'string' ? detail : detail?.message || `Request failed (${status})`
    super(message)
    this.status = status
    this.detail = detail
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(conn.url.replace(/\/+$/, '') + path, {
    method,
    headers: {
      'X-Admin-Key': conn.key,
      'X-Admin-Actor': conn.actor,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail = res.statusText
    try { detail = (await res.json()).detail ?? detail } catch { /* non-JSON error page */ }
    throw new ApiError(res.status, detail)
  }
  return res.json()
}
