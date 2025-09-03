import { NextRequest, NextResponse } from 'next/server'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('notion_token')?.value
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  const list: { id: string, title: string }[] = []
  let hasMore = true
  let start_cursor: string | undefined

  while (hasMore) {
    const res = await fetch(`${NOTION_API_BASE}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { value: 'database', property: 'object' },
        query: q || undefined,
        start_cursor,
        page_size: 50,
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const status = res.status
      return NextResponse.json({ message: 'Failed to list databases' }, { status })
    }
    const json = await res.json() as any
    const results = json.results as any[]
    for (const db of results) {
      const title = (db.title || [])
        .map((t: any) => t.plain_text)
        .join('') || db.id
      list.push({ id: db.id, title })
    }
    hasMore = json.has_more
    start_cursor = json.next_cursor || undefined
  }

  return NextResponse.json({ databases: list }, { status: 200 })
}
