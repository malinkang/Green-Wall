import { useEffect, useRef, useState } from 'react'

import { DotIcon } from 'lucide-react'
// removed logout popover on avatar per requirement

import { useData } from '~/DataContext'
import { GraphSize } from '~/enums'
import { numberWithCommas, getLongestContributionStreak } from '~/helpers'


type NeonMe = { name?: string; avatar_url?: string }

const Avatar = ({ neonAvatarUrl }: { neonAvatarUrl?: string }) => {
  const { graphData } = useData()
  const { settings } = useData()
  const [error, setError] = useState(false)
  if (!graphData) return null
  const src = settings.avatarUrl || neonAvatarUrl || graphData.avatarUrl
  return (
    <span className="size-full overflow-hidden rounded-full bg-[var(--level-0)]">
      {!error ? (
        <img
          src={src}
          alt={`${graphData.login}'s avatar.`}
          className="h-full w-full"
          data-export-ignore="true"
          onError={() => setError(true)}
        />
      ) : (
        <span className="inline-block size-full bg-gradient-to-br from-[var(--level-1)] to-[var(--level-2)]" />
      )}
    </span>
  )
}

export function GraphHeader() {
  const { graphData, firstYear, lastYear, totalYears, totalContributions, settings } = useData()
  const [neonMe, setNeonMe] = useState<NeonMe | null>(null)

  // Fetch current user from Neon when available (silently ignore 401/404)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/neon/me')
        if (!res.ok) return
        const json = (await res.json()) as NeonMe
        setNeonMe(json)
      } catch {}
    }
    void run()
  }, [])

  if (!graphData) {
    return null
  }

  // username and profile link are no longer displayed in header

  const unitLabel = (() => {
    switch (settings.unit) {
      case 'piece': return '个'
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

  // Determine display year range based on settings
  let [startYear, endYear] = settings.yearRange ?? []
  startYear = startYear && Number.isInteger(Number(startYear)) ? startYear : undefined
  endYear = endYear && Number.isInteger(Number(endYear)) ? endYear : undefined
  const filteredCalendars = graphData.contributionCalendars.filter((cal) => {
    if (startYear && endYear) return cal.year >= Number(startYear) && cal.year <= Number(endYear)
    return true
  })

  // Calculate active days (count > 0) within selected range and longest streak
  const activeDays = filteredCalendars.reduce((sum, cal) => {
    return (
      sum
      + cal.weeks.reduce((s, w) => s + w.days.filter((d) => d.level !== 'NONE' && d.count > 0).length, 0)
    )
  }, 0)

  const filteredGraphData = {
    ...graphData,
    contributionCalendars: filteredCalendars,
  }
  const { maxStreak } = getLongestContributionStreak(filteredGraphData as any)

  return (
    <div className="flex w-full items-center">
      <span className="mr-4 flex shrink-0 items-center">
        <span className="flex size-20 items-center rounded-full">
          <Avatar neonAvatarUrl={neonMe?.avatar_url} />
        </span>
      </span>

      <div className="flex basis-1/2 flex-col gap-1">
        <div>
          <span className="text-xl font-semibold" translate="no">
            {settings.titleOverride?.trim()
              ? settings.titleOverride.trim()
              : (neonMe?.name?.trim() || graphData.login || graphData.name)}
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
            <img alt="logo" className="h-9 w-9 object-contain" src={settings.logoUrl} data-export-ignore="true" />
          </span>
        )}

        <span className="opacity-70">
          {formatByUnit(filteredCalendars.reduce((s, c) => s + c.total, 0))}
        </span>

        <span className="opacity-70">
          {(() => {
            const fy = (startYear ?? firstYear) as string | undefined
            const ly = (endYear ?? lastYear) as string | undefined
            if (fy && ly) return fy === ly ? `${fy}` : `${fy}-${ly}`
            return '-'
          })()}
        </span>
      </div>
    </div>
  )
}
