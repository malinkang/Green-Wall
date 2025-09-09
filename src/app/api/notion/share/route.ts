import { NextRequest, NextResponse } from 'next/server'
import { decryptJSON } from '~/lib/secure'
import { fetchNotionGraphData } from '~/services-notion'
import { neonSql } from '~/lib/neon'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('payload')
  if (!token) return NextResponse.json({ message: 'Missing payload' }, { status: 400 })

  let parsed: { t: string; db: string; dp: string; cp?: string }
  try {
    parsed = decryptJSON(searchParams.get('payload') as string)
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
  }

  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const now = new Date()
  const current = now.getFullYear()
  const startYear = start ? Number(start) : current - 1
  const endYear = end ? Number(end) : current
  const years: number[] = []
  for (let y = Math.min(startYear, endYear); y <= Math.max(startYear, endYear); y++) years.push(y)

  try {
    // Fetch last edited time for cache key
    const metaRes = await fetch(`https://api.notion.com/v1/databases/${parsed.db}`, {
      headers: {
        Authorization: `Bearer ${parsed.t}`,
        'Notion-Version': '2022-06-28',
      },
      cache: 'no-store',
    })
    let lastEditedTime: string | undefined
    if (metaRes.ok) {
      const meta = await metaRes.json() as any
      lastEditedTime = meta?.last_edited_time
    }

    const cacheKey = `${parsed.dp}|${parsed.cp ?? ''}|${years.join(',')}|${lastEditedTime ?? 'unknown'}`
    const rows = await neonSql`
      SELECT graph_json FROM notion_cache2 WHERE database_id = ${parsed.db} AND cache_key = ${cacheKey}
    `
    if (rows[0]?.graph_json) {
      return NextResponse.json({ data: rows[0].graph_json })
    }

    const data = await fetchNotionGraphData({
      databaseId: parsed.db,
      dateProp: parsed.dp,
      countProp: parsed.cp,
      years,
      tokenOverride: parsed.t,
    })
    await neonSql`
      INSERT INTO notion_cache2 (database_id, cache_key, last_edited_time, graph_json, updated_at)
      VALUES (${parsed.db}, ${cacheKey}, ${lastEditedTime ? `${lastEditedTime}::timestamptz` : null}::timestamptz, ${data as any}, NOW())
      ON CONFLICT (database_id, cache_key)
      DO UPDATE SET last_edited_time = EXCLUDED.last_edited_time, graph_json = EXCLUDED.graph_json, updated_at = NOW()
    `
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to build graph' }, { status: 500 })
  }
}
