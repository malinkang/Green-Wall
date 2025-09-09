import { NextRequest, NextResponse } from 'next/server'
import { sql } from '~/lib/db'

// POST /api/users
// Body: { external_id?: string, name?: string, avatar_url?: string }
// Upserts a user by external_id (if provided), else creates a new one.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      external_id?: string
      name?: string
      avatar_url?: string
    }

    const { external_id, name, avatar_url } = body

    if (external_id) {
      const { rows } = await sql`
        INSERT INTO users (external_id, name, avatar_url)
        VALUES (${external_id}, ${name ?? null}, ${avatar_url ?? null})
        ON CONFLICT (external_id)
        DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
        RETURNING *
      `
      return NextResponse.json({ user: rows[0] })
    }

    const { rows } = await sql`
      INSERT INTO users (name, avatar_url)
      VALUES (${name ?? null}, ${avatar_url ?? null})
      RETURNING *
    `
    return NextResponse.json({ user: rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ message }, { status: 400 })
  }
}

