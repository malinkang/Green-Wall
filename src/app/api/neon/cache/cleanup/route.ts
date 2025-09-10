import { NextRequest, NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

export async function POST(request: NextRequest) {
  try {
    let ttlDays = 30
    let keepVersions = 2
    try {
      const body = await request.json()
      if (typeof body?.ttlDays === 'number' && body.ttlDays > 0) ttlDays = Math.floor(body.ttlDays)
      if (typeof body?.keepVersions === 'number' && body.keepVersions >= 0) keepVersions = Math.floor(body.keepVersions)
    } catch {}

    const threshold = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000)

    // TTL cleanup: notion_year_cache
    const delYearTtl = await neonSql`
      DELETE FROM notion_year_cache WHERE updated_at < ${threshold} RETURNING 1
    `

    // Version cleanup: keep latest N versions per database_id based on last_edited_time
    // Use dense_rank over distinct (database_id, last_edited_time)
    const delYearOld = await neonSql`
      WITH latest AS (
        SELECT database_id, last_edited_time,
               dense_rank() OVER (PARTITION BY database_id ORDER BY last_edited_time DESC NULLS LAST) AS rnk
        FROM notion_year_cache
        GROUP BY database_id, last_edited_time
      )
      DELETE FROM notion_year_cache ny
      USING latest l
      WHERE ny.database_id = l.database_id
        AND (ny.last_edited_time IS NOT DISTINCT FROM l.last_edited_time)
        AND l.rnk > ${keepVersions}
      RETURNING 1
    `

    // TTL cleanup: notion_meta_cache
    const delMetaTtl = await neonSql`
      DELETE FROM notion_meta_cache WHERE updated_at < ${threshold} RETURNING 1
    `

    return NextResponse.json({
      ok: true,
      deleted: {
        notion_year_cache: {
          ttl: delYearTtl.length,
          oldVersions: delYearOld.length,
        },
        notion_meta_cache: {
          ttl: delMetaTtl.length,
        },
      },
      params: { ttlDays, keepVersions },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}

