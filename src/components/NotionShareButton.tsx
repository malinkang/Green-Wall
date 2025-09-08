import { useEffect, useState } from 'react'

import Link from 'next/link'
import { ArrowUpRightIcon, Share2Icon } from 'lucide-react'

import { DEFAULT_SIZE, DEFAULT_THEME } from '~/constants'
import { useData } from '~/DataContext'
import { RadixPopover } from './ui-kit/RadixPopover'

export function NotionShareButton(props: { databaseId: string; dateProp: string; countProp?: string }) {
  const { settings, firstYear, lastYear } = useData()
  const [shareUrl, setShareUrl] = useState<URL | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const makeUrl = async () => {
      if (!props.databaseId || !props.dateProp) return
      const res = await fetch('/api/notion/share-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId: props.databaseId, dateProp: props.dateProp, countProp: props.countProp }),
      })
      if (!res.ok) return
      const json = await res.json() as { payload: string }

      const Url = new URL(`${window.location.origin}/share/notion`)
      Url.searchParams.set('payload', json.payload)

      if (Array.isArray(settings.yearRange)) {
        const [startYear, endYear] = settings.yearRange
        if (startYear && startYear !== firstYear) Url.searchParams.set('start', startYear)
        if (endYear && endYear !== lastYear) Url.searchParams.set('end', endYear)
      }
      if (settings.size && settings.size !== DEFAULT_SIZE) Url.searchParams.set('size', settings.size)
      if (settings.theme && settings.theme !== DEFAULT_THEME) Url.searchParams.set('theme', settings.theme)
      if (settings.showSafariHeader === false) Url.searchParams.set('showSafariHeader', 'false')
      if (settings.showAttribution === false) Url.searchParams.set('showAttribution', 'false')

      if (settings.unit && settings.unit !== 'contributions') Url.searchParams.set('unit', settings.unit)

      setShareUrl(Url)
    }
    void makeUrl()
    // regenerate when inputs or settings change
  }, [props.databaseId, props.dateProp, props.countProp, settings, firstYear, lastYear])

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
                  <button className="flex h-full items-center gap-x-1 rounded bg-main-200 px-2">
                    <span>预览</span>
                    <ArrowUpRightIcon className="size-4 translate-y-px" />
                  </button>
                </Link>
                <button
                  className="inline-block h-full min-w-14 rounded bg-accent-100 px-1 text-accent-600"
                  onClick={() => {
                    if (shareUrl && !copied) {
                      void navigator.clipboard.writeText(shareUrl.toString()).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
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
      title="分享 Notion 图表"
    >
      <button
        className="inline-flex h-full items-center rounded-md bg-main-100 px-4 py-2 text-sm font-medium text-main-500 hover:bg-main-200 disabled:pointer-events-none motion-safe:transition-colors motion-safe:duration-300 md:text-base"
      >
        <Share2Icon className="mr-2 size-4 shrink-0 md:size-5" />
        <span>分享</span>
      </button>
    </RadixPopover>
  )
}
