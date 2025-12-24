'use client'

import { useId, useRef, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DotIcon } from 'lucide-react'

import { ContributionsGraph } from '~/components/ContributionsGraph/ContributionsGraph'
import { GraphActionBar } from '~/components/GraphActionBar'
import { Loading } from '~/components/Loading/Loading'
import { Separator } from '~/components/ui/separator'
import { useData } from '~/DataContext'
import { useSettingPopup } from '~/hooks/useSettingPopup'
import { transformWeReadDataToGraphData } from '~/services/weread-transformer'
import { fetchWeReadSummary } from '~/services/weread-auth'
import type { GraphData } from '~/types'

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

    useEffect(() => {
        // Load data from different sources:
        // 1. Heatmap data: from summary cache (weread_summary) or call summary API
        // 2. ReadStats: from report_data (detail API response)
        const loadReportData = async () => {
            try {
                const storedYear = year || localStorage.getItem('weread_report_year')
                const currentUser = localStorage.getItem('weread_user')
                const storedReportData = localStorage.getItem('weread_report_data')

                let user = { name: 'WeRead User', avatar: '' }
                if (currentUser) {
                    user = JSON.parse(currentUser)
                }

                // Load readStats from detail API response (weread_report_data)
                if (storedReportData) {
                    const reportData = JSON.parse(storedReportData)
                    if (reportData.readStat) {
                        setReadStats(reportData.readStat)
                    }
                }

                // Load heatmap data from summary cache or call API
                let summaryData = null
                const cachedSummary = localStorage.getItem('weread_summary')

                if (cachedSummary) {
                    // Use cached summary data for heatmap
                    console.log('Using cached summary data for heatmap')
                    summaryData = JSON.parse(cachedSummary)
                } else {
                    // No cache, try to call summary API
                    console.log('No summary cache, calling summary API...')
                    const vid = localStorage.getItem('weread_vid')
                    const accessToken = localStorage.getItem('weread_token')
                    const refreshToken = localStorage.getItem('weread_refresh_token') || ''
                    const deviceId = localStorage.getItem('weread_device_id') || 'web_device'

                    if (vid && accessToken) {
                        try {
                            summaryData = await fetchWeReadSummary({
                                vid: Number(vid),
                                accessToken,
                                refreshToken,
                                deviceId
                            })
                            // Cache the summary data for future use
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
                    // Force usageUnit to be seconds to ensure correct display
                    graphData.usageUnit = 'seconds'

                    // Filter to only show the selected year if available
                    if (storedYear) {
                        const yearInt = parseInt(storedYear, 10)
                        graphData.contributionYears = [yearInt]
                        graphData.contributionCalendars = graphData.contributionCalendars.filter(c => c.year === yearInt)
                    }

                    setLocalGraphData(graphData)
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
                                >
                                    {readStats.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                                            {readStats.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-lg border p-4 shadow-sm flex flex-col items-center justify-center gap-1"
                                                    style={{ borderColor: 'var(--theme-border)' }}
                                                >
                                                    <div className="text-xs opacity-70">{item.stat}</div>
                                                    <div className="text-lg font-bold">{item.counts}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
