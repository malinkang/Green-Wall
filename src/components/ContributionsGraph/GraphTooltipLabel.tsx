'use client'

import { useTranslations } from 'next-intl'

import { DEFAULT_SIZE } from '~/constants'
import { useData } from '~/DataContext'
import { GraphSize } from '~/enums'
import { formatSecondsToDuration } from '~/helpers'

export interface GraphTooltipLabelProps {
  count: number
  date: string
  unit?: 'seconds' | 'contributions'
}

export function GraphTooltipLabel({ count, date, unit }: GraphTooltipLabelProps) {
  const { settings, graphData } = useData()
  const t = useTranslations('graph')

  const size = settings.size ?? DEFAULT_SIZE

  // Use passed unit prop, or fall back to graphData.usageUnit
  const effectiveUnit = unit ?? graphData?.usageUnit

  return (
    <span className={size === GraphSize.Small ? 'text-xs' : 'text-sm'}>
      {effectiveUnit === 'seconds'
        ? (
          <>
            {date}
            ：
            <strong>{formatSecondsToDuration(count)}</strong>
          </>
        )
        : t.rich('tooltipContributionsInDate', {
          count,
          date,
          strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
        })}
    </span>
  )
}
