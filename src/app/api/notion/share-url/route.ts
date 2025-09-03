import { NextRequest, NextResponse } from 'next/server'
import { encryptJSON } from '~/lib/secure'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('notion_token')?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as
    | { databaseId?: string; dateProp?: string; countProp?: string }
    | null

  const databaseId = body?.databaseId?.trim()
  const dateProp = body?.dateProp?.trim()
  const countProp = body?.countProp?.trim()

  if (!databaseId || !dateProp) {
    return NextResponse.json({ message: 'databaseId and dateProp are required' }, { status: 400 })
  }

  const payload = encryptJSON({ t: token, db: databaseId, dp: dateProp, cp: countProp || undefined })
  return NextResponse.json({ payload })
}

