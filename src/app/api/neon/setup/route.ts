import { NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

export async function POST() {
  try {
    // Extensions (best-effort)
    try { await neonSql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` } catch {}
    try { await neonSql`CREATE EXTENSION IF NOT EXISTS pgcrypto;` } catch {}

    await neonSql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT COALESCE(uuid_generate_v4(), gen_random_uuid()),
        external_id TEXT UNIQUE,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        notion_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    // Backfill: add notion_token column if table already exists
    try {
      await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notion_token TEXT;`
    } catch {}
    try {
      await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`
    } catch {}

    await neonSql`
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
        show_card BOOLEAN,
        year_order TEXT,
        year_start TEXT,
        year_end TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    // Backfill columns for persistence when table already exists
    try { await neonSql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS show_card BOOLEAN;` } catch {}
    try { await neonSql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS year_order TEXT;` } catch {}

    // Notion database cache table
    await neonSql`
      CREATE TABLE IF NOT EXISTS notion_cache (
        database_id TEXT PRIMARY KEY,
        last_edited_time TIMESTAMPTZ,
        graph_json JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    await neonSql`
      CREATE TABLE IF NOT EXISTS notion_meta_cache (
        database_id TEXT PRIMARY KEY,
        last_edited_time TIMESTAMPTZ,
        meta_json JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    // New cache table with parameterized key to support multiple ranges/props
    // Drop legacy whole-range cache table (replaced by notion_year_cache)
    try { await neonSql`DROP TABLE IF EXISTS notion_cache2;` } catch {}

    await neonSql`
      CREATE TABLE IF NOT EXISTS notion_year_cache (
        database_id TEXT NOT NULL,
        cache_key_year TEXT NOT NULL,
        year INT NOT NULL,
        last_edited_time TIMESTAMPTZ,
        calendar_json JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (database_id, cache_key_year)
      );
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
