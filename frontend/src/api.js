const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export async function api(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${apiBase}${path}`, { ...options, headers })
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`)
  return payload
}

export const jsonBody = value => JSON.stringify(value)
