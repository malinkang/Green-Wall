import { useEffect, useState } from 'react'

import Link from 'next/link'
import { ArrowUpRightIcon, MousePointerClickIcon } from 'lucide-react'

import { DEFAULT_SIZE, DEFAULT_THEME } from '~/constants'
import { useData } from '~/DataContext'
import { trackEvent } from '~/helpers'
import { encodeShareSettings } from '~/lib/shareParams'

import { RadixPopover } from './ui-kit/RadixPopover'

export function ShareButton() {
  const { graphData, settings, firstYear, lastYear } = useData()
  const username = graphData?.login

  const [shareUrl, setShareUrl] = useState<URL>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (username) {
      const Url = new URL(`${window.location.origin}/share/${username}`)

      // Build compact share settings payload
      const payload: any = {}
      if (Array.isArray(settings.yearRange)) {
        const [startYear, endYear] = settings.yearRange
        if (startYear && startYear !== firstYear) payload.start = startYear
        if (endYear && endYear !== lastYear) payload.end = endYear
      }
      if (settings.size && settings.size !== DEFAULT_SIZE) payload.size = settings.size
      if (settings.theme && settings.theme !== DEFAULT_THEME) payload.theme = settings.theme
      if (settings.showSafariHeader === true) payload.showSafariHeader = true
      if (settings.showAttribution === false) payload.showAttribution = false
      if (settings.showHeader === false) payload.showHeader = false
      if (settings.showCard === false) payload.showCard = false
      if (settings.yearOrder === 'desc') payload.yearOrder = 'desc'
      if (settings.unit && settings.unit !== 'piece') payload.unit = settings.unit
      if (settings.titleOverride && settings.titleOverride.trim()) payload.title = settings.titleOverride.trim()
      if (settings.subtitleOverride && settings.subtitleOverride.trim()) payload.subtitle = settings.subtitleOverride.trim()
      if (settings.avatarUrl && settings.avatarUrl.trim()) payload.avatar = settings.avatarUrl.trim()
      if (settings.logoUrl && settings.logoUrl.trim()) payload.logo = settings.logoUrl.trim()

      const s = encodeShareSettings(payload)
      if (s) Url.searchParams.set('s', s)

      setShareUrl(Url)
    }
  }, [username, settings, firstYear, lastYear])

  return (
    <RadixPopover
      content={(
        <div className="max-w-[90vw] rounded-md pt-2 md:max-w-[min(40vw,300px)]">
          {shareUrl && (
            <div className="overflow-hidden rounded bg-main-100/80 p-3 pb-2 text-xs text-main-500 md:text-sm">
              <div className="break-all">
                <span>{shareUrl.href.replace(shareUrl.search, '')}</span>
                <span className="opacity-60">{shareUrl.search}</span>
              </div>

              <div className="-mr-1 mt-4 flex h-7 items-center justify-end gap-x-2">
                <Link passHref className="h-full" href={shareUrl} target="_blank">
                  <button
                    className="flex h-full items-center gap-x-1 rounded bg-main-200 px-2"
                    onClick={() => {
                      trackEvent('Preview Share URL')
                    }}
                  >
                    <span>预览</span>
                    <ArrowUpRightIcon className="size-4 translate-y-px" />
                  </button>
                </Link>
                <button
                  className="inline-block h-full min-w-14 rounded bg-accent-100 px-1 text-accent-600"
                  onClick={() => {
                    if (!copied) {
                      trackEvent('Copy Share URL')

                      void navigator.clipboard.writeText(shareUrl.toString()).then(() => {
                        setCopied(true)
                        setTimeout(() => {
                          setCopied(false)
                        }, 1500)
                      })
                    }
                  }}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      title="分享你的图表"
    >
      <button className="simple-button divider">
        <MousePointerClickIcon className="size-5" />
        <span>分享</span>
      </button>
    </RadixPopover>
  )
}
