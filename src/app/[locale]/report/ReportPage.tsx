'use client'

import { useId, useRef, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DotIcon, BookOpenIcon, BookCheckIcon, CalendarDaysIcon, PenLineIcon } from 'lucide-react'

import { ContributionsGraph } from '~/components/ContributionsGraph/ContributionsGraph'
import { GraphActionBar } from '~/components/GraphActionBar'
import { Loading } from '~/components/Loading/Loading'
import { Separator } from '~/components/ui/separator'
import { useData } from '~/DataContext'
import { useSettingPopup } from '~/hooks/useSettingPopup'
import { transformWeReadDataToGraphData } from '~/services/weread-transformer'
import { fetchWeReadSummary } from '~/services/weread-auth'
import type { GraphData } from '~/types'
import { MonthlyReadingChart } from './MonthlyReadingChart'
import { LongestStreakCard } from './LongestStreakCard'
import { BookCoverWall } from './BookCoverWall'

function Divider() {
    return (
        <div className="w-full flex justify-center">
            <div className="my-4 flex items-center gap-x-2 w-1/2">
                <Separator className="flex-1" />
                <DotIcon className="size-4 shrink-0 text-muted-foreground" />
                <Separator className="flex-1" />
            </div>
        </div>
    )
}

interface ReadStat {
    stat: string
    counts: string
    scheme: string
}

interface ReportPageProps {
    year?: string
}

export function ReportPage({ year }: ReportPageProps) {
    const t = useTranslations('home') // Reuse home translations for now or create new ones
    const graphRef = useRef<HTMLDivElement>(null)

    const settingPopoverContentId = useId()
    const graphWrapperId = useId()

    const { isLoading: isGlobalLoading } = useData()

    const {
        settingPopupPosition,
        closeSettingPopup,
        graphActionsRefCallback,
        handleSettingPopOut,
    } = useSettingPopup(graphWrapperId)

    const [isLoading, setIsLoading] = useState(true)
    const [readStats, setReadStats] = useState<ReadStat[]>([])
    const [localGraphData, setLocalGraphData] = useState<GraphData>()
    const [readTimes, setReadTimes] = useState<Record<string, number>>()
    const [dailyReadTimes, setDailyReadTimes] = useState<Record<string, number>>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [readLongest, setReadLongest] = useState<any[]>()

    useEffect(() => {
        // Load data from different sources:
        // 1. Heatmap data: from summary cache (weread_summary) or call summary API
        // 2. ReadStats: from report_data cache or call detail API
        const loadReportData = async () => {
            try {
                const storedYear = year || localStorage.getItem('weread_report_year')
                const currentUser = localStorage.getItem('weread_user')

                let user = { name: 'WeRead User', avatar: '' }
                if (currentUser) {
                    user = JSON.parse(currentUser)
                }

                // Get credentials
                const vid = localStorage.getItem('weread_vid')
                const accessToken = localStorage.getItem('weread_token')
                const refreshToken = localStorage.getItem('weread_refresh_token') || ''
                const deviceId = localStorage.getItem('weread_device_id') || 'web_device'
                const activationCode = localStorage.getItem('weread_activation_code') || ''

                // Always fetch fresh data from detail API
                let reportData = null
                if (vid && accessToken && storedYear) {
                    console.log('Fetching detail API for year:', storedYear)
                    try {
                        const baseTime = new Date(Number(storedYear), 0, 1).getTime() / 1000
                        const response = await fetch("https://api.notionhub.app/get-weread-detail", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                vid,
                                accessToken,
                                deviceId,
                                refreshToken,
                                activationCode,
                                baseTime
                            })
                        })
                        if (response.ok) {
                            reportData = await response.json()
                            console.log('Detail data fetched successfully')
                        }
                    } catch (apiError) {
                        console.error('Failed to fetch detail API:', apiError)
                    }
                }

                // Set readStats, readTimes and readLongest from report data (detail API)
                if (reportData) {
                    if (reportData.readStat) {
                        setReadStats(reportData.readStat)
                    }
                    if (reportData.readTimes) {
                        setReadTimes(reportData.readTimes)
                    }
                    if (reportData.readLongest) {
                        setReadLongest(reportData.readLongest)
                    }
                    // Note: dailyReadTimes now comes from summary data for accurate streak calculation
                }

                // Load heatmap data from summary cache or call API
                let summaryData = null
                const cachedSummary = localStorage.getItem('weread_summary')

                if (cachedSummary) {
                    console.log('Using cached summary data for heatmap')
                    summaryData = JSON.parse(cachedSummary)
                } else {
                    console.log('No summary cache, calling summary API...')
                    if (vid && accessToken) {
                        try {
                            summaryData = await fetchWeReadSummary({
                                vid: Number(vid),
                                accessToken,
                                refreshToken,
                                deviceId
                            })
                            if (summaryData) {
                                localStorage.setItem('weread_summary', JSON.stringify(summaryData))
                                console.log('Summary data fetched and cached')
                            }
                        } catch (apiError) {
                            console.error('Failed to fetch summary API:', apiError)
                        }
                    }
                }

                // Transform summary data to graph data for heatmap
                if (summaryData) {
                    const graphData = transformWeReadDataToGraphData(summaryData, user.name, user.avatar)
                    graphData.usageUnit = 'seconds'

                    if (storedYear) {
                        const yearInt = parseInt(storedYear, 10)
                        graphData.contributionYears = [yearInt]
                        graphData.contributionCalendars = graphData.contributionCalendars.filter(c => c.year === yearInt)
                    }

                    setLocalGraphData(graphData)

                    // Use summary's readTimes for longest streak calculation
                    if (summaryData.readTimes) {
                        setDailyReadTimes(summaryData.readTimes)
                    }
                }
            } catch (e) {
                console.error("Failed to load report data", e)
            } finally {
                setIsLoading(false)
            }
        }

        loadReportData()
    }, [year])


    const handleSettingClick = () => {
        if (settingPopupPosition) {
            closeSettingPopup()
        }
    }

    const handleSettingPopOutClick = () => {
        handleSettingPopOut(settingPopoverContentId)
    }

    const renderContent = () => {
        const showLoading = isLoading || isGlobalLoading

        if (showLoading || localGraphData) {
            return (
                <Loading active={showLoading}>
                    {localGraphData && (
                        <>
                            <div
                                ref={graphActionsRefCallback}
                                className="flex flex-row-reverse flex-wrap items-center justify-center gap-x-6 gap-y-4 py-5"
                            >
                                <GraphActionBar
                                    graphRef={graphRef}
                                    settingPopoverContentId={settingPopoverContentId}
                                    settingPopupPosition={settingPopupPosition}
                                    username={localGraphData.login}
                                    onSettingClick={handleSettingClick}
                                    onSettingPopOut={handleSettingPopOutClick}
                                    onSettingPopupClose={closeSettingPopup}
                                    hiddenYearRange={true}
                                />
                            </div>

                            <Divider />

                            <div className="flex overflow-x-auto md:justify-center">
                                <ContributionsGraph
                                    ref={graphRef}
                                    wrapperId={graphWrapperId}
                                    data={localGraphData}
                                    unit="seconds"
                                    showInspect={false}
                                >
                                    {readStats.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                                            {readStats.map((item, index) => {
                                                // Split counts into number and unit (e.g., "123本" -> "123" + "本")
                                                const match = item.counts.match(/^([\d,]+)(.*)$/)
                                                const number = match ? match[1] : item.counts
                                                const unit = match ? match[2] : ''

                                                // Assign icons and colors based on stat type
                                                const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
                                                    '读过': { icon: <BookOpenIcon className="size-5 text-blue-500" />, color: 'text-blue-500' },
                                                    '读完': { icon: <BookCheckIcon className="size-5 text-green-500" />, color: 'text-green-500' },
                                                    '阅读': { icon: <CalendarDaysIcon className="size-5 text-purple-500" />, color: 'text-purple-500' },
                                                    '笔记': { icon: <PenLineIcon className="size-5 text-pink-500" />, color: 'text-pink-500' },
                                                }
                                                const { icon, color } = iconMap[item.stat] || { icon: null, color: 'text-blue-500' }

                                                return (
                                                    <div
                                                        key={index}
                                                        className="rounded-lg border p-4 shadow-sm"
                                                        style={{ borderColor: 'var(--theme-border)' }}
                                                    >
                                                        <div className="flex items-center gap-2 mb-3">
                                                            {icon}
                                                            <span className="font-medium">{item.stat}</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className={`text-4xl font-bold ${color}`}>{number}</span>
                                                            {unit && <span className="text-lg ml-1">{unit}</span>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Longest Streak Card */}
                                    <div className="px-6 pb-6">
                                        <LongestStreakCard
                                            dailyReadTimes={dailyReadTimes}
                                            year={year ? parseInt(year, 10) : new Date().getFullYear()}
                                            isLoading={isLoading}
                                        />
                                    </div>

                                    {/* Monthly Reading Chart */}
                                    <div className="px-6 pb-6">
                                        <MonthlyReadingChart
                                            readTimes={readTimes}
                                            isLoading={isLoading}
                                            year={year ? parseInt(year, 10) : new Date().getFullYear()}
                                        />
                                    </div>

                                    {/* Book Cover Wall - temporarily hidden */}
                                    {/* <div className="px-6 pb-6">
                                        <BookCoverWall
                                            readLongest={readLongest}
                                            isLoading={isLoading}
                                        />
                                    </div> */}
                                </ContributionsGraph>
                            </div>
                        </>
                    )}
                </Loading>
            )
        }

        return <div>No data found. Please try generating the report again.</div>
    }

    return (
        <div className="py-10 md:py-14">
            <h1 className="text-center text-3xl font-bold md:mx-auto md:px-20 md:text-4xl md:leading-[1.2] lg:text-6xl">
                {year ? `${year} ` : ''}微信读书年度回顾
            </h1>

            {renderContent()}
        </div>
    )
}
