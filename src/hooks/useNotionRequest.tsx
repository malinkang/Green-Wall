import { useCallback, useState } from 'react'
import { useEvent } from 'react-use-event-hook'

import { setSearchParamsToUrl, trackEvent } from '~/helpers'
import type { ContributionYear, ResponseData } from '~/types'

interface UseNotionRequestConfig {
  onError?: () => void
}

export function useNotionRequest(config: UseNotionRequestConfig = {}) {
  const onError = useEvent(() => {
    config.onError?.()
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Pick<ResponseData, 'errorType' | 'message'>>()

  const run = useCallback(
    async (params: {
      databaseId: string
      dateProp?: string
      countProp?: string
      years?: ContributionYear[]
    }) => {
      try {
        setError(undefined)
        setLoading(true)

        const { databaseId, dateProp = 'Date', countProp, years } = params
        const baseUrl = setSearchParamsToUrl({
          url: '/api/notion',
          paramName: 'years',
          paramValue: years?.map(y => y.toString()) ?? [],
        })

        const url = new URL(baseUrl, 'https://x.com')
        url.searchParams.set('databaseId', databaseId)
        if (dateProp) url.searchParams.set('dateProp', dateProp)
        if (countProp) url.searchParams.set('countProp', countProp)

        const res = await fetch(url.toString().replace(url.origin, ''))
        const resJson = await res.json() as ResponseData

        if (res.ok) {
          return resJson.data
        }
        else {
          setError({ errorType: resJson.errorType, message: resJson.message })
        }
      }
      catch (err) {
        if (err instanceof Error) {
          trackEvent('Error: Fetch Notion Data', { msg: err.message })
        }
        onError()
      }
      finally {
        setLoading(false)
      }
    },
    [onError],
  )

  return { run, loading, error }
}

