import { useEffect, useRef, useState } from 'react'

import { DotIcon } from 'lucide-react'
import { RadixPopover } from '~/components/ui-kit/RadixPopover'

import { useData } from '~/DataContext'
import { GraphSize } from '~/enums'
import { numberWithCommas, getLongestContributionStreak } from '~/helpers'


const Avatar = () => {
  const { graphData } = useData()
  const { settings } = useData()

  const init = useRef(false)
  const avatarRoot = useRef<HTMLSpanElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>()

  useEffect(() => {
    const root = avatarRoot.current

    // Dynamically load and append the avatar image:
    // 1. Shows loading state while fetching
    // 2. Handles successful load by appending img to container
    // 3. Shows fallback UI on error
    // 4. Uses ref to prevent multiple loads
    if (root && graphData && !init.current) {
      if (!root.hasChildNodes()) {
        setStatus('loading')

        const avatarImg = new window.Image()
        try {
          if (!settings.avatarUrl) {
            avatarImg.crossOrigin = 'anonymous'
          }
        } catch {}

        avatarImg.onload = () => {
          root.appendChild(avatarImg)
          setStatus('loaded')
        }

        avatarImg.onerror = () => {
          setStatus('error')
        }

        const src = settings.avatarUrl || graphData.avatarUrl
        avatarImg.src = src
        avatarImg.alt = `${graphData.login}'s avatar.`
        avatarImg.classList.add('h-full', 'w-full')
        init.current = true
      }
    }
  }, [graphData])

  return (
    <span
      ref={avatarRoot}
      className={`size-full overflow-hidden rounded-full bg-[var(--level-0)] ${
        status === 'loading' ? 'animate-pulse' : ''
      }`}
    >
      {status === 'error' && (
        <span className="inline-block size-full bg-gradient-to-br from-[var(--level-1)] to-[var(--level-2)]" />
      )}
    </span>
  )
}

export function GraphHeader() {
  const { graphData, firstYear, lastYear, totalYears, totalContributions, settings } = useData()

  if (!graphData) {
    return null
  }

  // username and profile link are no longer displayed in header

  const unitLabel = (() => {
    switch (settings.unit) {
      case 'second': return '秒'
      case 'minute': return '分钟'
      case 'hour': return '小时'
      case 'meter': return '米'
      case 'kilometer': return '千米'
      default: return '次'
    }
  })()

  const formatByUnit = (value: number): string => {
    if (settings.unit === 'second' || settings.unit === 'minute' || settings.unit === 'hour') {
      let totalMinutes = 0
      if (settings.unit === 'second') totalMinutes = Math.floor(value / 60)
      if (settings.unit === 'minute') totalMinutes = value
      if (settings.unit === 'hour') totalMinutes = value * 60

      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      if (hours <= 0) return minutes === 0 ? '' : `${minutes}分钟`
      if (minutes === 0) return `${hours}小时`
      return `${hours}小时${minutes}分钟`
    }
    if (value === 0) return ''
    return `${numberWithCommas(value)} ${unitLabel}`
  }

  // Calculate active days (count > 0) and longest streak
  const activeDays = graphData.contributionCalendars.reduce((sum, cal) => {
    return (
      sum
      + cal.weeks.reduce((s, w) => s + w.days.filter((d) => d.level !== 'NONE' && d.count > 0).length, 0)
    )
  }, 0)

  const { maxStreak } = getLongestContributionStreak(graphData)

  return (
    <div className="flex w-full items-center">
      <span className="mr-4 flex shrink-0 items-center">
        <RadixPopover
          title={undefined}
          content={(
            <div className="flex flex-col gap-2">
              <button
                className="inline-flex items-center rounded bg-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-200"
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/notion/logout', { method: 'POST' })
                  } catch {}
                  try {
                    // 回到 Notion 页面或刷新当前页
                    if (window.location.pathname.startsWith('/notion')) {
                      window.location.reload()
                    } else {
                      window.location.href = '/notion'
                    }
                  } catch {}
                }}
              >
                退出登录
              </button>
            </div>
          )}
        >
          <button
            type="button"
            aria-haspopup="dialog"
            className="flex size-20 items-center cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-accent-400/60"
          >
            <Avatar />
          </button>
        </RadixPopover>
      </span>

      <div className="flex basis-1/2 flex-col gap-1">
        <div>
          <span className="text-xl font-semibold" translate="no">
            {settings.titleOverride?.trim()
              ? settings.titleOverride.trim()
              : (graphData.source === 'notion' && graphData.dbTitle
                ? `@${graphData.dbTitle}`
                : graphData.name)}
          </span>
        </div>

        {settings.subtitleOverride?.trim() && (
          <div
            className={`line-clamp-3 text-sm opacity-70 ${
              settings.size === GraphSize.Small ? 'max-w-[300px]' : 'max-w-[400px]'
            }`}
          >
            {settings.subtitleOverride.trim()}
          </div>
        )}

        <div className="flex items-center gap-y-1 text-sm">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span>共{numberWithCommas(activeDays)}天</span>
          </span>

          <DotIcon className="size-5" />

          <span className="flex items-center gap-1 whitespace-nowrap">
            <span>最长连续{numberWithCommas(maxStreak)}天</span>
          </span>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 text-xs">
        {settings.logoUrl && (
          <span className="pb-2 inline-block size-9">
            <img alt="logo" className="h-9 w-9 object-contain" src={settings.logoUrl} />
          </span>
        )}

        <span className="opacity-70">
          {typeof totalContributions === 'number' ? (formatByUnit(totalContributions) || '') : ''}
        </span>

        <span className="opacity-70">
          {firstYear && lastYear
            ? (firstYear === lastYear ? `${firstYear}` : `${firstYear}-${lastYear}`)
            : '-'}
        </span>
      </div>
    </div>
  )
}
