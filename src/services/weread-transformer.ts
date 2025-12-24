import { ContributionCalendar, ContributionDay, GraphData } from '~/types'
import { ContributionLevel } from '~/enums'

// Define the assumed structure of WeRead summary data
// Adjust based on actual API response
export interface WeReadDailyStat {
    readingDate: number // Timestamp in seconds or milliseconds? Usually timestamp.
    readingTime: number // Duration in seconds
}

export interface WeReadSummaryResponse {
    dailyStats: WeReadDailyStat[]
    totalReadingTime: number
    // add other fields as observed
}

export function transformWeReadDataToGraphData(
    weReadData: any, // Use any initially to be flexible with response
    login: string,
    avatarUrl: string
): GraphData {
    // 1. Parse the data
    let stats: WeReadDailyStat[] = []

    if (Array.isArray(weReadData)) {
        stats = weReadData
    } else if (Array.isArray(weReadData?.dailyStats)) {
        stats = weReadData.dailyStats
    } else if (Array.isArray(weReadData?.data)) {
        stats = weReadData.data
    } else if (weReadData?.dailyReadTimes && typeof weReadData.dailyReadTimes === 'object') {
        // dailyReadTimes: { timestamp(seconds): duration(seconds) }
        stats = Object.entries(weReadData.dailyReadTimes).map(([ts, duration]) => ({
            readingDate: Number(ts),
            readingTime: Number(duration)
        }))
    } else if (weReadData?.readTimes && typeof weReadData.readTimes === 'object') {
        // readTimes: { timestamp(seconds): duration(ms) }
        stats = Object.entries(weReadData.readTimes).map(([ts, ms]) => ({
            readingDate: Number(ts),
            readingTime: Number(ms)
        }))
    }

    // 2. Group by Year
    const yearMap = new Map<number, ContributionDay[]>()

    // Initialize years from 2018 to current year
    const currentYear = new Date().getFullYear();
    for (let y = 2018; y <= currentYear; y++) {
        yearMap.set(y, []);
    }

    stats.forEach(stat => {
        const date = new Date(stat.readingDate * 1000) // Timestamp is in seconds
        const year = date.getFullYear()

        // Skip if year is outside our range (though 2018-now should cover it)
        if (year < 2018 || year > currentYear) return;

        const dateStr = date.toISOString().split('T')[0]
        const count = stat.readingTime // seconds

        // Calculate level based on readTimeGears: [60, 1800, 3600, 10800, 18000]
        // 1 min, 30 min, 60 min, 3 hours, 5 hours
        let level: ContributionLevel = ContributionLevel.NONE
        if (count >= 60) level = ContributionLevel.FIRST_QUARTILE
        if (count >= 1800) level = ContributionLevel.SECOND_QUARTILE
        if (count >= 3600) level = ContributionLevel.THIRD_QUARTILE
        if (count >= 10800) level = ContributionLevel.FOURTH_QUARTILE

        if (!yearMap.has(year)) {
            yearMap.set(year, [])
        }

        yearMap.get(year)?.push({
            date: dateStr,
            count,
            level,
            weekday: date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
        })
    })

    // 3. Construct ContributionCalendars
    const contributionCalendars: ContributionCalendar[] = []
    const years = Array.from(yearMap.keys()).sort((a, b) => b - a)

    years.forEach(year => {
        const days = yearMap.get(year) || []
        // Helper to generate full year weeks
        const weeks = generateWeeksForYear(year, days)

        contributionCalendars.push({
            year,
            total: days.reduce((sum, d) => sum + d.count, 0), // Total seconds
            weeks
        })
    })

    return {
        login,
        avatarUrl,
        contributionYears: years,
        contributionCalendars,
        // Add fake followers etc to satisfy type
        followers: { totalCount: 0 },
        following: { totalCount: 0 },
        usageUnit: 'seconds'
    }
}

function generateWeeksForYear(year: number, dataPoints: ContributionDay[]) {
    const weeks: { days: ContributionDay[] }[] = []
    const dataMap = new Map(dataPoints.map(d => [d.date, d]))

    // Start from Jan 1 or the first Sunday before/of Jan 1?
    // GitHub calendar usually starts from the Sunday of the week containing Jan 1?
    // Let's iterate day by day.

    let currentDate = new Date(year, 0, 1)
    // Adjust to start on Sunday
    const dayOfWeek = currentDate.getDay() // 0 is Sunday
    currentDate.setDate(currentDate.getDate() - dayOfWeek)

    let currentWeek: ContributionDay[] = []

    // Iterate enough weeks to cover the year
    // A safe upper bound is 54 weeks
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const yearOfDate = currentDate.getFullYear()

        // Stop if we've moved past the year completely (and finished the last week)
        if (yearOfDate > year && currentDate.getDay() === 0) break

        // Look up data or default
        const dayData = dataMap.get(dateStr) || {
            date: dateStr,
            count: 0,
            level: ContributionLevel.NONE,
            weekday: currentDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
        }

        currentWeek.push(dayData)

        if (currentWeek.length === 7) {
            weeks.push({ days: currentWeek })
            currentWeek = []
        }

        currentDate.setDate(currentDate.getDate() + 1)
    }

    return weeks
}
/**
 * Convert milliseconds to a human‑readable string "xx小时xx分钟xx秒".
 */
export function formatMsToHMS(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}小时${minutes}分钟${seconds}秒`;
}
