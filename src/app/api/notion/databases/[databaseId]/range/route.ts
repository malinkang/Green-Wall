import { NextRequest, NextResponse } from 'next/server'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export async function GET(_req: NextRequest, context: { params: Promise<{ databaseId: string }> }) {
  const { databaseId } = await context.params
  const { searchParams } = new URL(_req.url)
  const dateProp = searchParams.get('dateProp') || ''

  const token = _req.cookies.get('notion_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!databaseId || !dateProp) return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })

  const common: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  }

  const bodyBase = {
    filter: { property: dateProp, date: { is_not_empty: true } },
    page_size: 1,
  }

  const q = async (direction: 'ascending' | 'descending') => {
    const res = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      ...common,
      body: JSON.stringify({ ...bodyBase, sorts: [{ property: dateProp, direction }] }),
    })
    if (!res.ok) throw new Error(`notion query failed: ${res.status}`)
    const json = await res.json() as any
    const page = json.results?.[0]
    const prop = page?.properties?.[dateProp]
    const iso = prop?.date?.start as string | undefined
    return iso ? Number(iso.substring(0, 4)) : undefined
  }

  try {
    const startYear = await q('ascending')
    const endYear = await q('descending')
    return NextResponse.json({ startYear, endYear }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to fetch range' }, { status: 400 })
  }
}

