import { NextRequest, NextResponse } from 'next/server'

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

