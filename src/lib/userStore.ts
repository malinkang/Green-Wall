export function getLocalExternalId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('client_external_id')
  if (!id) {
    id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
    localStorage.setItem('client_external_id', id)
  }
  return id
}

export function getNeonUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('neon_user_id')
}

export function setNeonUserId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('neon_user_id', id)
}

