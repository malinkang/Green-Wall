import { type NextRequest, NextResponse } from 'next/server'

import { ErrorType } from '~/enums'
import { getValuableStatistics } from '~/helpers'
import type { ContributionCalendar, ContributionYear, GraphData, ResponseData, ValuableStatistics } from '~/types'
import { fetchNotionGraphData, fetchNotionDatabaseMeta } from '~/services-notion'
import { neonSql } from '~/lib/neon'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const databaseId = searchParams.get('databaseId') || ''
  const dateProp = searchParams.get('dateProp') || 'Date'
  const countProp = searchParams.get('countProp') || undefined
  const statistics = searchParams.get('statistics') === 'true'
  const queryYears = searchParams.getAll('years').map(Number).filter(n => Number.isFinite(n)) as ContributionYear[]

  if (!databaseId) {
    return NextResponse.json< ResponseData >({ errorType: ErrorType.BadRequest, message: 'Missing databaseId' }, { status: 400 })
  }

  const years = queryYears.length > 0 ? queryYears : [new Date().getFullYear()]

  try {
    const token = request.cookies.get('notion_token')?.value
    // Fetch database meta to get last edited time for caching decision
    const metaRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
      cache: 'no-store',
    })
    let lastEditedTime: string | undefined
    let meta: any | undefined
    if (metaRes.ok) {
      meta = await metaRes.json() as any
      lastEditedTime = meta?.last_edited_time
      // upsert meta cache
      try {
        await neonSql`
          INSERT INTO notion_meta_cache (database_id, last_edited_time, meta_json, updated_at)
          VALUES (${databaseId}, ${lastEditedTime ? `${lastEditedTime}::timestamptz` : null}::timestamptz, ${meta as any}, NOW())
          ON CONFLICT (database_id)
          DO UPDATE SET last_edited_time = EXCLUDED.last_edited_time, meta_json = EXCLUDED.meta_json, updated_at = NOW()
        `
      } catch {}
    }

    // Try cache v2 with parameterized key (dateProp|countProp|years|lastEditedTime)
    const cacheKey = `${dateProp}|${countProp ?? ''}|${years.join(',')}|${lastEditedTime ?? 'unknown'}`
    // Per-year cache
    const cachedCalendars: ContributionCalendar[] = []
    const missingYears: number[] = []
    for (const y of years) {
      const perYearKey = `${dateProp}|${countProp ?? ''}|${y}|${lastEditedTime ?? 'unknown'}`
      const r = await neonSql`
        SELECT calendar_json FROM notion_year_cache WHERE database_id = ${databaseId} AND cache_key_year = ${perYearKey}
      `
      if (r[0]?.calendar_json) {
        cachedCalendars.push(r[0].calendar_json as ContributionCalendar)
      } else {
        missingYears.push(y)
      }
    }

    let data: GraphData
    if (missingYears.length > 0) {
      const fresh = await fetchNotionGraphData({ databaseId, dateProp, countProp, years: missingYears, statistics, tokenOverride: token })
      // upsert per-year cache
      for (const cal of fresh.contributionCalendars) {
        const perYearKey = `${dateProp}|${countProp ?? ''}|${cal.year}|${lastEditedTime ?? 'unknown'}`
        await neonSql`
          INSERT INTO notion_year_cache (database_id, cache_key_year, last_edited_time, calendar_json, updated_at)
          VALUES (${databaseId}, ${perYearKey}, ${lastEditedTime ? `${lastEditedTime}::timestamptz` : null}::timestamptz, ${cal as any}, NOW())
          ON CONFLICT (database_id, cache_key_year)
          DO UPDATE SET last_edited_time = EXCLUDED.last_edited_time, calendar_json = EXCLUDED.calendar_json, updated_at = NOW()
        `
      }
      const calendars = [...cachedCalendars, ...fresh.contributionCalendars].sort((a, b) => a.year - b.year)
      data = {
        login: fresh.login,
        name: fresh.name,
        avatarUrl: fresh.avatarUrl,
        bio: fresh.bio,
        followers: fresh.followers,
        following: fresh.following,
        contributionYears: years,
        contributionCalendars: calendars,
        source: 'notion',
        profileUrl: fresh.profileUrl,
      }
    } else {
      // build graphData from meta + cached calendars
      const meta = await fetchNotionDatabaseMeta(databaseId, token as string)
      const calendars = cachedCalendars.sort((a, b) => a.year - b.year)
      data = {
        login: meta.title,
        name: meta.title,
        avatarUrl: meta.avatarUrl || '/favicon.svg',
        bio: 'Notion Database Heatmap',
        followers: { totalCount: 0 },
        following: { totalCount: 0 },
        contributionYears: years,
        contributionCalendars: calendars,
        source: 'notion',
        profileUrl: `https://www.notion.so/${databaseId.replace(/-/g, '')}`,
      }
    }

    let valuableStatistics: ValuableStatistics | undefined
    if (statistics) {
      valuableStatistics = getValuableStatistics(data)
    }
    data = valuableStatistics ? { ...data, statistics: valuableStatistics } : data

    // Optionally upsert full-range cache (can keep for sharing), but year-level already saved

    return NextResponse.json({ data }, { status: 200 })
  }
  catch (err) {
    if (err instanceof Error) {
      const status = /credentials|auth|401|403/i.test(err.message) ? 401 : 400
      const errorType = status === 401 ? ErrorType.BadCredentials : ErrorType.BadRequest
      return NextResponse.json< ResponseData >({ errorType, message: err.message }, { status })
    }
    return NextResponse.json< ResponseData >({ errorType: ErrorType.BadRequest, message: 'Unknown error' }, { status: 400 })
  }
}
