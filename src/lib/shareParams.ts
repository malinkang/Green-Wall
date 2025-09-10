export type ShareSettingsPayload = Partial<{
  start: string
  end: string
  size: string
  theme: string
  unit: string
  title: string
  subtitle: string
  avatar: string
  logo: string
  showSafariHeader: boolean
  showAttribution: boolean
  showCard: boolean
  showHeader: boolean
  yearOrder: 'asc' | 'desc'
}>

function toBase64Url(s: string) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  // Node fallback
  // eslint-disable-next-line n/no-deprecated-api
  return Buffer.from(s, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(s: string) {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : ''
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(b64)
  }
  // eslint-disable-next-line n/no-deprecated-api
  return Buffer.from(b64, 'base64').toString('utf-8')
}

export function encodeShareSettings(payload: ShareSettingsPayload): string {
  try {
    return toBase64Url(JSON.stringify(payload))
  } catch {
    return ''
  }
}

export function decodeShareSettings(s: string): ShareSettingsPayload | null {
  try {
    const json = fromBase64Url(s)
    const obj = JSON.parse(json)
    return obj
  } catch {
    return null
  }
}

