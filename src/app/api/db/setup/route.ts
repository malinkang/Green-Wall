import { NextResponse } from 'next/server'
import { sql } from '~/lib/db'

export async function POST() {
  try {
    // Enable extensions (ignore errors if already exist)
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    } catch {}
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`
    } catch {}

    // users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT COALESCE(uuid_generate_v4(), gen_random_uuid()),
        external_id TEXT UNIQUE,
        name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    // user_settings table (1:1)
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        unit TEXT,
        title_override TEXT,
        subtitle_override TEXT,
        avatar_url TEXT,
        logo_url TEXT,
        theme TEXT,
        size TEXT,
        block_shape TEXT,
        days_label BOOLEAN,
        show_attribution BOOLEAN,
        show_safari_header BOOLEAN,
        year_start TEXT,
        year_end TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}

