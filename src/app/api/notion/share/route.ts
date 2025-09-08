import { NextRequest, NextResponse } from 'next/server'
import { decryptJSON } from '~/lib/secure'
import { fetchNotionGraphData } from '~/services-notion'

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
    const data = await fetchNotionGraphData({
      databaseId: parsed.db,
      dateProp: parsed.dp,
      countProp: parsed.cp,
      years,
      tokenOverride: parsed.t,
    })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to build graph' }, { status: 500 })
  }
}
