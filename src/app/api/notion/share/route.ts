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

    const cachedCalendars: any[] = []
    const missingYears: number[] = []
    for (const y of years) {
      const perYearKey = `${parsed.dp}|${parsed.cp ?? ''}|${y}|${lastEditedTime ?? 'unknown'}`
      const r = await neonSql`
        SELECT calendar_json FROM notion_year_cache WHERE database_id = ${parsed.db} AND cache_key_year = ${perYearKey}
      `
      if (r[0]?.calendar_json) cachedCalendars.push(r[0].calendar_json)
      else missingYears.push(y)
    }

    let data
    if (missingYears.length > 0) {
      const fresh = await fetchNotionGraphData({
        databaseId: parsed.db,
        dateProp: parsed.dp,
        countProp: parsed.cp,
        years: missingYears,
        tokenOverride: parsed.t,
      })
      for (const cal of fresh.contributionCalendars) {
        const perYearKey = `${parsed.dp}|${parsed.cp ?? ''}|${cal.year}|${lastEditedTime ?? 'unknown'}`
        await neonSql`
          INSERT INTO notion_year_cache (database_id, cache_key_year, last_edited_time, calendar_json, updated_at)
          VALUES (${parsed.db}, ${perYearKey}, ${lastEditedTime ? `${lastEditedTime}::timestamptz` : null}::timestamptz, ${cal as any}, NOW())
          ON CONFLICT (database_id, cache_key_year)
          DO UPDATE SET last_edited_time = EXCLUDED.last_edited_time, calendar_json = EXCLUDED.calendar_json, updated_at = NOW()
        `
      }
      const calendars = [...cachedCalendars, ...fresh.contributionCalendars].sort((a, b) => a.year - b.year)
      data = {
        ...fresh,
        contributionYears: years,
        contributionCalendars: calendars,
      }
    } else {
      // Build from cached only; use minimal meta
      const calendars = cachedCalendars.sort((a, b) => a.year - b.year)
      data = {
        login: '',
        name: '',
        avatarUrl: '/favicon.svg',
        bio: 'Notion Database Heatmap',
        followers: { totalCount: 0 },
        following: { totalCount: 0 },
        contributionYears: years,
        contributionCalendars: calendars,
        source: 'notion',
        profileUrl: `https://www.notion.so/${parsed.db.replace(/-/g, '')}`,
      }
    }
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to build graph' }, { status: 500 })
  }
}
