import { type NextRequest, NextResponse } from 'next/server'

import { ErrorType } from '~/enums'
import { getValuableStatistics } from '~/helpers'
import type { ContributionYear, GraphData, ResponseData, ValuableStatistics } from '~/types'
import { fetchNotionGraphData } from '~/services-notion'

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
    const graphData = await fetchNotionGraphData({ databaseId, dateProp, countProp, years, statistics, tokenOverride: token })

    let valuableStatistics: ValuableStatistics | undefined
    if (statistics) {
      valuableStatistics = getValuableStatistics(graphData)
    }

    const data: GraphData = valuableStatistics ? { ...graphData, statistics: valuableStatistics } : graphData
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
