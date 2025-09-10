import { useRef, useState } from 'react'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { GraphTooltip } from '~/components/ContributionsGraph/GraphTooltip'
import { levels } from '~/constants'
import { useData } from '~/DataContext'
import { ContributionLevel, GraphSize } from '~/enums'
import { numberWithCommas } from '~/helpers'
import type { ContributionCalendar, ContributionDay } from '~/types'

import styles from './Graph.module.css'

export interface GraphProps extends React.ComponentProps<'div'> {
  data: ContributionCalendar
  daysLabel?: boolean
  weekLabel?: boolean
  showInspect?: boolean
  titleRender?: (params: {
    year: number
    total: number
    isNewYear: boolean
  }) => React.ReactNode | null
}

const newYearText = 'Happy New Year 🎉 Go make the first contribution !'

export function Graph(props: GraphProps) {
  const { data: calendar, daysLabel, showInspect = true, titleRender, ...rest } = props

  const { username, settings } = useData()

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
      // Normalize to minutes
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
    // Non-time units: keep number + unit label
    if (value === 0) return ''
    return `${numberWithCommas(value)} ${unitLabel}`
  }

  const currentYear = new Date().getFullYear()
  const isNewYear
    = currentYear === calendar.year
      && (new Date(currentYear, 0, 2).getTime() - Date.now()) / 1000 / 60 / 60 / 24 >= 0

  const [tooltipInfo, setTooltipInfo] = useState<ContributionDay>()
  const [refEle, setRefEle] = useState<HTMLElement | null>(null)
  const delayTimer = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (refTarget: HTMLElement, info: ContributionDay) => {
    delayTimer.current = setTimeout(() => {
      setRefEle(refTarget)
      setTooltipInfo(info)
    }, 50)
  }

  const handleMouseLeave = () => {
    if (delayTimer.current) {
      window.clearTimeout(delayTimer.current)
    }

    setRefEle(null)
  }

  return (
    <div {...rest} className={`${rest.className ?? ''} group`}>
      <div className="mb-2 flex items-center">
        {typeof titleRender === 'function'
          ? (
              titleRender({
                year: calendar.year,
                total: calendar.total,
                isNewYear,
              })
            )
          : (
              <div className="text-sm tabular-nums">
                <span className="mr-2 font-medium">{calendar.year}:</span>
                <span className="opacity-80">
                  {isNewYear && calendar.total === 0
                    ? newYearText
                    : formatByUnit(calendar.total)}
                </span>
              </div>
            )}

        {showInspect && (
          <button className="group/inspect ml-auto rounded bg-[var(--theme-secondary)] px-2 py-1 text-sm text-current opacity-0 outline outline-transparent transition-all hover:outline-[var(--theme-border)] group-hover:opacity-100">
            <Link
              className="inline-flex items-center gap-0.5"
              href={`/year/${calendar.year}/${username}`}
              target="_blank"
            >
              <span className="opacity-70 transition group-hover/inspect:opacity-100">Inspect</span>
              <ChevronRight className="size-4 transition group-hover/inspect:translate-x-0.5" />
            </Link>
          </button>
        )}
      </div>

      <GraphTooltip
        label={
          tooltipInfo
            ? (() => {
                const text = formatByUnit(tooltipInfo.count)
                if (!text) return null
                return (
                  <span className={settings.size === GraphSize.Small ? 'text-xs' : 'text-sm'}>
                    <strong className="font-medium">{text}</strong>
                    {' 在 '}
                    {tooltipInfo.date}
                  </span>
                )
              })()
            : null
        }
        refElement={refEle}
      />

      <div className={styles.graph}>
        {/* Months Label */}
        <ul className={styles.months}>
          <li>Jan</li>
          <li>Feb</li>
          <li>Mar</li>
          <li>Apr</li>
          <li>May</li>
          <li>Jun</li>
          <li>Jul</li>
          <li>Aug</li>
          <li>Sep</li>
          <li>Oct</li>
          <li>Nov</li>
          <li>Dec</li>
        </ul>

        {/* Days Label */}
        {daysLabel && (
          <ul className={styles.days}>
            <li>Sun</li>
            <li>Mon</li>
            <li>Tue</li>
            <li>Wed</li>
            <li>Thu</li>
            <li>Fri</li>
            <li>Sat</li>
          </ul>
        )}

        {/* Day Blocks */}
        <ul className={`${styles.grids} ${styles.blocks}`}>
          {calendar.weeks.reduce<React.ReactElement[]>((blocks, week, i) => {
            let days = week.days

            if (days.length < 7) {
              const fills = Array.from(Array(7 - days.length)).map<ContributionDay>(() => ({
                level: ContributionLevel.Null,
                count: 0,
                date: '',
              }))

              if (i === 0) {
                days = [...fills, ...week.days]
              }
              else {
                days = [...week.days, ...fills]
              }
            }

            days.forEach((day, j) => {
              blocks.push(
                <li
                  key={`${i}${j}`}
                  data-level={levels[day.level]}
                  onMouseEnter={(ev) => {
                    handleMouseEnter(ev.currentTarget, day)
                  }}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    if (day.url && day.count > 0) {
                      window.open(day.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                />,
              )
            })

            return blocks
          }, [])}
        </ul>
      </div>
    </div>
  )
}
