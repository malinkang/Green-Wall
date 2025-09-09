import { NextRequest, NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('notion_token')?.value
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const res = await fetch(`${NOTION_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
      },
      cache: 'no-store',
    })
    const status = res.status
    const user = await res.json()
    if (!res.ok) return NextResponse.json(user, { status })

    const external_id: string = user.id
    const name: string | null = user.name || null
    const avatar_url: string | null = user.avatar_url || null

    const rows = await neonSql`
      INSERT INTO users (external_id, name, avatar_url)
      VALUES (${external_id}, ${name}, ${avatar_url})
      ON CONFLICT (external_id)
      DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ user: rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ message }, { status: 400 })
  }
}

