import { useEffect, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AtSignIcon, BookOpenIcon, DotIcon, FlameIcon } from 'lucide-react'


import { useData } from '~/DataContext'
import { GraphSize } from '~/enums'
import { formatSecondsToDuration, numberWithCommas } from '~/helpers'
import { cn } from '~/lib/utils'



const Avatar = ({ avatarUrl, login }: { avatarUrl?: string, login?: string }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    if (avatarUrl) {
      setStatus('loading')
    }
    else {
      setStatus('loading')
    }
  }, [avatarUrl])

  return (
    <span
      className="relative size-full overflow-hidden rounded-full bg-(--level-0)"
    >
      {avatarUrl && login && status !== 'error' && (
        <Image
          alt={`${login}'s avatar.`}
          className="h-full w-full object-cover"
          src={avatarUrl}
          fill
          priority
          unoptimized={avatarUrl.startsWith('data:')} // Handle data URIs if any, though unlikely for avatars here
          onError={() => {
            setStatus('error')
          }}
          onLoad={() => {
            setStatus('loaded')
          }}
        />
      )}
      {status === 'error' && (
        <span className="inline-block size-full bg-linear-to-br from-(--level-1) to-(--level-2)" />
      )}
    </span>
  )
}

import type { GraphData } from '~/types'

interface GraphHeaderProps {
  data?: GraphData
  unit?: 'seconds' | 'contributions'
}

export function GraphHeader({ data, unit }: GraphHeaderProps) {
  const t = useTranslations('graph')
  const { graphData: contextGraphData, lastYear: contextLastYear, totalYears: contextTotalYears, totalContributions: contextTotalContributions, settings } = useData()

  const graphData = data ?? contextGraphData

  if (!graphData) {
    return null
  }

  const totalYears = data ? graphData.contributionYears.length : contextTotalYears
  const totalContributions = data ? graphData.contributionCalendars.reduce((sum, c) => sum + c.total, 0) : contextTotalContributions
  const lastYear = data ? graphData.contributionYears.at(0)?.toString() : contextLastYear

  const username = graphData.login

  const { totalReadingDays, longestStreak } = (() => {
    let readingDays = 0
    let currentStreak = 0
    let maxStreak = 0

    // Flatten all days from all calendars within range
    const allDays = graphData.contributionCalendars
      .filter(calendar => {
        if (!settings.yearRange) return true
        const [start, end] = settings.yearRange
        const year = calendar.year
        if (start && end) return year >= Number(start) && year <= Number(end)
        return true
      })
      .flatMap(c => c.weeks)
      .flatMap(w => w.days)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    for (const day of allDays) {
      if (!day) {
        continue
      }
      if (day.count > 0) {
        readingDays++
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return { totalReadingDays: readingDays, longestStreak: maxStreak }
  })()


  return (
    <div className="flex w-full items-center">
      <Link
        className="mr-4 flex shrink-0 items-center"
        href="https://weread.qq.com/"
        target="_blank"
      >
        <span className="flex size-20 items-center">
          <Avatar avatarUrl={graphData.avatarUrl} login={graphData.login} />
        </span>
      </Link>

      <div className="flex basis-1/2 flex-col gap-1">
        <div>
          {!!graphData.name && (
            <span className="text-xl font-semibold" translate="no">
              {graphData.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-y-1 text-sm">
          <span className="flex items-center" translate="no">
            <AtSignIcon className="mr-px size-[13px]" />
            {graphData.login}
            <span className="ml-1 font-medium" style={{ color: '#3399FF' }}>微信读书</span>
          </span>
        </div>

        <div className="flex items-center gap-y-1 text-sm">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <BookOpenIcon className="size-4" />
            <span>{t('readingDays', { count: numberWithCommas(totalReadingDays) })}</span>
          </span>

          <DotIcon className="size-5" />

          <span className="flex items-center gap-1 whitespace-nowrap">
            <FlameIcon className="size-4" />
            <span>{t('longestStreak', { count: numberWithCommas(longestStreak) })}</span>
          </span>
        </div>


        {!!graphData.bio && (
          <div
            className={cn(
              'line-clamp-3 text-sm opacity-70',
              settings.size === GraphSize.Small ? 'max-w-[300px]' : 'max-w-[400px]',
            )}
          >
            {graphData.bio}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 text-xs">
        <Link className="pb-2" href="https://weread.qq.com/" target="_blank">
          <span className="inline-block size-9 overflow-hidden rounded-md">
            <Image
              src="https://images.notionhub.app/weread.webp"
              alt="WeRead Logo"
              className="object-contain"
              width={36}
              height={36}
              priority
            />
          </span>
        </Link>

        <span className="opacity-70">
          {(() => {
            const val = Number(totalContributions)
            if (!Number.isFinite(val)) return '-'

            const effectiveUnit = unit ?? graphData.usageUnit
            const isTime = effectiveUnit === 'seconds' || val > 1000

            return isTime
              ? formatSecondsToDuration(val)
              : t('commits', { count: numberWithCommas(val) })
          })()}
        </span>

        <span className="opacity-70">
          {typeof totalYears === 'number'
            ? totalYears === 1
              ? t('inYear', { year: lastYear ?? '-' })
              : t('years', { count: totalYears })
            : '-'}
        </span>
      </div>
    </div>
  )
}
