import crypto from 'crypto'

const ALG = 'aes-256-gcm'
const IV_LEN = 12 // GCM recommended IV length

function getKey(): Buffer {
  const secret = process.env.SHARE_SECRET || process.env.NOTION_CLIENT_SECRET
  if (!secret) throw new Error('Missing SHARE_SECRET')
  // derive 32-byte key
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptJSON(data: unknown): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const json = Buffer.from(JSON.stringify(data), 'utf8')
  const enc = Buffer.concat([cipher.update(json), cipher.final()])
  const tag = cipher.getAuthTag()
  // base64url(iv|enc|tag)
  const packed = Buffer.concat([iv, enc, tag]).toString('base64')
  return packed.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decryptJSON<T = any>(token: string): T {
  const key = getKey()
  const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
  const buf = Buffer.from(b64, 'base64')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(buf.length - 16)
  const enc = buf.subarray(IV_LEN, buf.length - 16)
  const decipher = crypto.createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return JSON.parse(dec.toString('utf8')) as T
}

