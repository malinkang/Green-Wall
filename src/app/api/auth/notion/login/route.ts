import { NextResponse } from 'next/server'

const AUTH_BASE = 'https://api.notion.com/v1/oauth/authorize'

export async function GET() {
  const clientId = process.env.NOTION_CLIENT_ID
  const redirectUri = process.env.NOTION_REDIRECT_URI
  const scopes = process.env.NOTION_OAUTH_SCOPES || 'databases.read,users.read'

  if (!clientId || !redirectUri) {
    return NextResponse.json({ message: 'Missing NOTION_CLIENT_ID or NOTION_REDIRECT_URI' }, { status: 500 })
  }

  const url = new URL(AUTH_BASE)
  url.searchParams.set('owner', 'user')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scopes)

  return NextResponse.redirect(url.toString())
}

