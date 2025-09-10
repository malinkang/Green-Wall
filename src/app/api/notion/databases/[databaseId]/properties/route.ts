import { NextRequest, NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export async function GET(_req: NextRequest, context: { params: Promise<{ databaseId: string }> }) {
  const token = _req.cookies.get('notion_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { databaseId } = await context.params
  // Try cache first
  let json: any | null = null
  try {
    const rows = await neonSql`SELECT meta_json FROM notion_meta_cache WHERE database_id = ${databaseId}`
    if (rows[0]?.meta_json) json = rows[0].meta_json
  } catch {}

  if (!json) {
    const res = await fetch(`${NOTION_API_BASE}/databases/${databaseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    const status = res.status
    if (!res.ok) return NextResponse.json({ message: 'Failed to fetch database' }, { status })
    json = await res.json() as any
    // upsert meta cache
    const lastEditedTime = json?.last_edited_time ?? null
    const lastEditedAt = lastEditedTime ? new Date(lastEditedTime) : null
    try {
      await neonSql`
        INSERT INTO notion_meta_cache (database_id, last_edited_time, meta_json, updated_at)
        VALUES (${databaseId}, ${lastEditedAt}, ${json as any}, NOW())
        ON CONFLICT (database_id)
        DO UPDATE SET last_edited_time = EXCLUDED.last_edited_time, meta_json = EXCLUDED.meta_json, updated_at = NOW()
      `
    } catch {}
  }
  const props = json.properties as Record<string, any>
  const dateProps: { name: string }[] = []
  const numberProps: { name: string; type: string }[] = []

  for (const [name, def] of Object.entries(props)) {
    const t = (def as any).type as string
    if (t === 'date') {
      dateProps.push({ name })
    }
    if (t === 'number' || t === 'rollup' || t === 'formula') {
      numberProps.push({ name, type: t })
    }
  }

  return NextResponse.json({ dateProps, numberProps }, { status: 200 })
}
