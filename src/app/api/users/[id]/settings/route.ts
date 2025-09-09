import { NextRequest, NextResponse } from 'next/server'
import { sql } from '~/lib/db'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const { rows } = await sql`SELECT * FROM user_settings WHERE user_id = ${id}`
    return NextResponse.json({ settings: rows[0] ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const body = await req.json().catch(() => ({})) as any
    const {
      unit,
      title_override,
      subtitle_override,
      avatar_url,
      logo_url,
      theme,
      size,
      block_shape,
      days_label,
      show_attribution,
      show_safari_header,
      year_start,
      year_end,
    } = body

    const { rows } = await sql`
      INSERT INTO user_settings (
        user_id, unit, title_override, subtitle_override, avatar_url, logo_url, theme, size, block_shape,
        days_label, show_attribution, show_safari_header, year_start, year_end, updated_at
      ) VALUES (
        ${id}, ${unit ?? null}, ${title_override ?? null}, ${subtitle_override ?? null}, ${avatar_url ?? null}, ${logo_url ?? null},
        ${theme ?? null}, ${size ?? null}, ${block_shape ?? null}, ${days_label ?? null}, ${show_attribution ?? null},
        ${show_safari_header ?? null}, ${year_start ?? null}, ${year_end ?? null}, NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        unit = EXCLUDED.unit,
        title_override = EXCLUDED.title_override,
        subtitle_override = EXCLUDED.subtitle_override,
        avatar_url = EXCLUDED.avatar_url,
        logo_url = EXCLUDED.logo_url,
        theme = EXCLUDED.theme,
        size = EXCLUDED.size,
        block_shape = EXCLUDED.block_shape,
        days_label = EXCLUDED.days_label,
        show_attribution = EXCLUDED.show_attribution,
        show_safari_header = EXCLUDED.show_safari_header,
        year_start = EXCLUDED.year_start,
        year_end = EXCLUDED.year_end,
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ settings: rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ message }, { status: 400 })
  }
}

