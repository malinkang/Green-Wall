import { NextRequest, NextResponse } from 'next/server'
import { neonSql } from '~/lib/neon'

const TOKEN_URL = 'https://api.notion.com/v1/oauth/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect('/notion?error=' + encodeURIComponent(error))
  }

  const clientId = process.env.NOTION_CLIENT_ID
  const clientSecret = process.env.NOTION_CLIENT_SECRET
  const redirectUri = process.env.NOTION_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ message: 'Missing Notion OAuth envs' }, { status: 500 })
  }

  if (!code) {
    return NextResponse.redirect('/notion?error=missing_code')
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
    return NextResponse.redirect('/notion?error=token_exchange_failed')
  }

  const json = await res.json() as any
  const accessToken = json.access_token as string | undefined
  const expiresIn = (json.expires_in as number | undefined) ?? 60 * 60 * 24 * 7

  if (!accessToken) {
    return NextResponse.redirect('/notion?error=missing_token')
  }

  // Fetch Notion user info and upsert into Neon users table
  try {
    const meRes = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
      },
      cache: 'no-store',
    })
    if (meRes.ok) {
      const me = await meRes.json() as any
      const external_id: string = me?.id || ''
      const name: string | null = me?.name || me?.bot?.owner?.workspace_name || null
      const email: string | null = me?.person?.email || null
      const avatar_url: string | null = me?.avatar_url || null
      if (external_id) {
        await neonSql`
          INSERT INTO users (external_id, name, email, avatar_url, notion_token)
          VALUES (${external_id}, ${name}, ${email}, ${avatar_url}, ${accessToken})
          ON CONFLICT (external_id)
          DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url, notion_token = EXCLUDED.notion_token, updated_at = NOW()
        `
      }
    }
  } catch {}

  const response = NextResponse.redirect('/notion')
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
