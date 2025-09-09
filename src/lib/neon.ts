// Neon HTTP client (serverless-friendly Postgres for Vercel)
// Install: npm i @neondatabase/serverless
import { neon } from '@neondatabase/serverless'

export const neonSql = (() => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL for Neon connection')
  return neon(url)
})()

