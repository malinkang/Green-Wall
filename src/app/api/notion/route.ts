import { type NextRequest, NextResponse } from 'next/server'

import { ErrorType } from '~/enums'
import { getValuableStatistics } from '~/helpers'
import type { ContributionYear, GraphData, ResponseData, ValuableStatistics } from '~/types'
import { fetchNotionGraphData } from '~/services-notion'
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
    const rows = await neonSql`
      SELECT graph_json FROM notion_cache2 WHERE database_id = ${databaseId} AND cache_key = ${cacheKey}
    `
    if (rows[0]?.graph_json) {
      const cached = rows[0].graph_json as any
      return NextResponse.json({ data: cached }, { status: 200 })
    }

    const graphData = await fetchNotionGraphData({ databaseId, dateProp, countProp, years, statistics, tokenOverride: token })

    let valuableStatistics: ValuableStatistics | undefined
    if (statistics) {
      valuableStatistics = getValuableStatistics(graphData)
    }

    const data: GraphData = valuableStatistics ? { ...graphData, statistics: valuableStatistics } : graphData

    // Upsert cache
    await neonSql`
      INSERT INTO notion_cache2 (database_id, cache_key, last_edited_time, graph_json, updated_at)
      VALUES (${databaseId}, ${cacheKey}, ${lastEditedTime ? `${lastEditedTime}::timestamptz` : null}::timestamptz, ${data as any}, NOW())
      ON CONFLICT (database_id, cache_key)
      DO UPDATE SET last_edited_time = EXCLUDED.last_edited_time, graph_json = EXCLUDED.graph_json, updated_at = NOW()
    `

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
