'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { BarChart3Icon } from 'lucide-react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { formatSecondsToDuration } from '~/helpers'

interface MonthlyReadingData {
    month: string
    monthNum: number
    count: number
    isMax: boolean
}

interface CustomTooltipProps {
    active?: boolean
    payload?: { payload: MonthlyReadingData }[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null
    }

    const data = payload[0].payload

    return (
        <div className="rounded-lg border border-border bg-popover p-2 shadow-lg">
            <p className="font-medium text-popover-foreground text-sm">
                {data.month}
            </p>
            <p className="text-muted-foreground text-xs">
                {formatSecondsToDuration(data.count)}
            </p>
        </div>
    )
}

export interface MonthlyReadingChartProps {
    readTimes: Record<string, number> | undefined
    isLoading: boolean
    year: number
}

export function MonthlyReadingChart(props: MonthlyReadingChartProps) {
    const { readTimes, isLoading, year } = props
    const tMonths = useTranslations('months')

    const { data, totalSeconds, maxMonth } = useMemo(() => {
        if (!readTimes) {
            return { data: [], totalSeconds: 0, maxMonth: '' }
        }

        const monthNames = [
            tMonths('jan'), tMonths('feb'), tMonths('mar'), tMonths('apr'),
            tMonths('may'), tMonths('jun'), tMonths('jul'), tMonths('aug'),
            tMonths('sep'), tMonths('oct'), tMonths('nov'), tMonths('dec')
        ]

        // Convert readTimes object to array with month info
        const entries = Object.entries(readTimes).map(([timestamp, seconds]) => {
            const date = new Date(Number(timestamp) * 1000)
            const monthNum = date.getMonth()
            return {
                month: monthNames[monthNum],
                monthNum,
                count: seconds,
                isMax: false
            }
        })

        // Sort by month
        entries.sort((a, b) => a.monthNum - b.monthNum)

        // Find max
        let maxValue = 0
        let maxMonthName = ''
        entries.forEach(entry => {
            if (entry.count > maxValue) {
                maxValue = entry.count
                maxMonthName = entry.month
            }
        })

        // Mark max
        entries.forEach(entry => {
            entry.isMax = entry.count === maxValue && maxValue > 0
        })

        const total = entries.reduce((sum, e) => sum + e.count, 0)

        return { data: entries, totalSeconds: total, maxMonth: maxMonthName }
    }, [readTimes, tMonths])

    if (isLoading) {
        return (
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3Icon className="size-5" />
                    <span className="font-medium">月度阅读时长</span>
                </div>
                <div className="h-[200px] animate-pulse bg-foreground/5 rounded-md" />
            </div>
        )
    }

    if (data.length === 0) {
        return null
    }

    return (
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3Icon className="size-5" />
                    <span className="font-medium">{year}年月度阅读时长</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                        总计: <span className="font-medium">{formatSecondsToDuration(totalSeconds)}</span>
                    </span>
                    {maxMonth && (
                        <span className="text-muted-foreground">
                            峰值: <span className="font-medium">{maxMonth}</span>
                        </span>
                    )}
                </div>
            </div>

            <ResponsiveContainer height={200} width="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="3 3"
                        vertical={false}
                    />
                    <XAxis
                        axisLine={false}
                        dataKey="month"
                        fontSize={12}
                        stroke="var(--color-muted-foreground)"
                        tickLine={false}
                        tickMargin={8}
                    />
                    <YAxis
                        axisLine={false}
                        fontSize={12}
                        stroke="var(--color-muted-foreground)"
                        tickFormatter={(value: number) => {
                            const hours = Math.floor(value / 3600)
                            if (hours >= 1) {
                                return `${hours}h`
                            }
                            const minutes = Math.floor(value / 60)
                            return `${minutes}m`
                        }}
                        tickLine={false}
                        tickMargin={8}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                    />
                    <Bar
                        animationDuration={800}
                        dataKey="count"
                        radius={[4, 4, 0, 0]}
                    >
                        {data.map((entry) => (
                            <Cell
                                key={entry.month}
                                className="transition-opacity hover:opacity-80"
                                fill={entry.isMax ? 'var(--color-brand-500)' : 'var(--color-brand-300)'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
