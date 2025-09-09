import { NextRequest, NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('notion_token')?.value
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const rows = await neonSql`
      SELECT name, avatar_url FROM users WHERE notion_token = ${token} LIMIT 1
    `
    if (!rows[0]) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(rows[0], { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ message }, { status: 400 })
  }
}

