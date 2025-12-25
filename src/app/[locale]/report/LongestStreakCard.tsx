'use client'

import { useMemo } from 'react'
import { FlameIcon, CalendarIcon } from 'lucide-react'

interface LongestStreakCardProps {
    dailyReadTimes: Record<string, number> | undefined
    year: number
    isLoading: boolean
}

interface StreakInfo {
    days: number
    startDate: string
    endDate: string
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function calculateLongestStreak(dailyReadTimes: Record<string, number>): StreakInfo {
    // Convert to sorted array of timestamps
    const timestamps = Object.keys(dailyReadTimes)
        .map(ts => parseInt(ts, 10))
        .filter(ts => dailyReadTimes[ts.toString()] > 0) // Only count days with reading
        .sort((a, b) => a - b)

    if (timestamps.length === 0) {
        return { days: 0, startDate: '', endDate: '' }
    }

    const ONE_DAY = 86400 // seconds in a day

    let maxStreak = 1
    let maxStart = timestamps[0]
    let maxEnd = timestamps[0]

    let currentStreak = 1
    let currentStart = timestamps[0]

    for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i] - timestamps[i - 1]

        // Check if consecutive day (allow for slight timezone variations)
        if (diff >= ONE_DAY - 3600 && diff <= ONE_DAY + 3600) {
            currentStreak++
        } else {
            // Streak broken, check if it was the longest
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak
                maxStart = currentStart
                maxEnd = timestamps[i - 1]
            }
            currentStreak = 1
            currentStart = timestamps[i]
        }
    }

    // Check final streak
    if (currentStreak > maxStreak) {
        maxStreak = currentStreak
        maxStart = currentStart
        maxEnd = timestamps[timestamps.length - 1]
    }

    return {
        days: maxStreak,
        startDate: formatDate(maxStart),
        endDate: formatDate(maxEnd)
    }
}

export function LongestStreakCard({ dailyReadTimes, year, isLoading }: LongestStreakCardProps) {
    const streakInfo = useMemo(() => {
        if (!dailyReadTimes) {
            return { days: 0, startDate: '', endDate: '' }
        }

        // Filter to only include data from selected year (Jan 1st onwards)
        const yearStart = new Date(year, 0, 1).getTime() / 1000
        const yearEnd = new Date(year + 1, 0, 1).getTime() / 1000

        const filteredData: Record<string, number> = {}
        Object.entries(dailyReadTimes).forEach(([ts, duration]) => {
            const timestamp = parseInt(ts, 10)
            if (timestamp >= yearStart && timestamp < yearEnd) {
                filteredData[ts] = duration
            }
        })

        return calculateLongestStreak(filteredData)
    }, [dailyReadTimes, year])

    if (isLoading) {
        return (
            <div
                className="rounded-lg border p-4 shadow-sm"
                style={{ borderColor: 'var(--theme-border)' }}
            >
                <div className="h-20 animate-pulse bg-foreground/5 rounded-md" />
            </div>
        )
    }

    if (streakInfo.days === 0) {
        return null
    }

    return (
        <div
            className="rounded-lg border p-4 shadow-sm"
            style={{ borderColor: 'var(--theme-border)' }}
        >
            <div className="flex items-center gap-2 mb-3">
                <FlameIcon className="size-5 text-orange-500" />
                <span className="font-medium">最长连续阅读</span>
            </div>

            <div className="text-center mb-3">
                <span className="text-4xl font-bold text-orange-500">{streakInfo.days}</span>
                <span className="text-lg ml-1">天</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-4" />
                <span>{streakInfo.startDate} - {streakInfo.endDate}</span>
            </div>
        </div>
    )
}
