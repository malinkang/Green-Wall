import { NextRequest, NextResponse } from 'next/server'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('notion_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${NOTION_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
    cache: 'no-store',
  })
  const status = res.status
  const json = await res.json()
  if (!res.ok) return NextResponse.json(json, { status })
  return NextResponse.json(json, { status: 200 })
}

