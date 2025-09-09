import { NextRequest, NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

const TOKEN_URL = 'https://api.notion.com/v1/oauth/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 })
  }

  const clientId = process.env.NOTION_CLIENT_ID
  const clientSecret = process.env.NOTION_CLIENT_SECRET
  const redirectUri = process.env.NOTION_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ ok: false, message: 'Missing Notion OAuth envs' }, { status: 500 })
  }

  if (!code) {
    return NextResponse.json({ ok: false, message: 'Missing code' }, { status: 400 })
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ ok: false, message: 'token_exchange_failed' }, { status: 400 })
  }

  const json = (await res.json()) as any
  const accessToken = json.access_token as string | undefined
  const expiresIn = (json.expires_in as number | undefined) ?? 60 * 60 * 24 * 7

  if (!accessToken) {
    return NextResponse.json({ ok: false, message: 'missing_token' }, { status: 400 })
  }

  // Store token response details directly into DB without calling /users/me
  try {
    const ownerUser = (json as any)?.owner?.user || (json as any)?.bot?.owner?.user || null
    const external_id: string = ownerUser?.id || ''
    const name: string | null = ownerUser?.name || (json as any)?.workspace_name || null
    const email: string | null = ownerUser?.person?.email || null
    const avatar_url: string | null = ownerUser?.avatar_url || (json as any)?.workspace_icon || null
    if (external_id) {
      await neonSql`
        INSERT INTO users (external_id, name, email, avatar_url, notion_token)
        VALUES (${external_id}, ${name}, ${email}, ${avatar_url}, ${accessToken})
        ON CONFLICT (external_id)
        DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url, notion_token = EXCLUDED.notion_token, updated_at = NOW()
      `
    }
  } catch {}

  const response = NextResponse.json({ ok: true })
  const isProd = process.env.NODE_ENV === 'production'
  response.cookies.set('notion_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(60, expiresIn - 60),
  })
  return response
}
