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
        // Load data from localStorage
        const loadReportData = () => {
            try {
                const storedData = localStorage.getItem('weread_report_data')
                // const storedYear = localStorage.getItem('weread_report_year') // Use prop instead
                const storedYear = year || localStorage.getItem('weread_report_year')
                const currentUser = localStorage.getItem('weread_user')

                if (storedData) {
                    const data = JSON.parse(storedData)
                    let user = { name: 'WeRead User', avatar: '' }
                    if (currentUser) {
                        user = JSON.parse(currentUser)
                    }

                    // Transform data for the graph
                    const graphData = transformWeReadDataToGraphData(data, user.name, user.avatar)
                    // Force usageUnit to be seconds to ensure correct display
                    graphData.usageUnit = 'seconds'

                    // Filter to only show the selected year if available
                    if (storedYear) {
                        const yearInt = parseInt(storedYear, 10)
                        graphData.contributionYears = [yearInt]
                        graphData.contributionCalendars = graphData.contributionCalendars.filter(c => c.year === yearInt)
                    }

                    setLocalGraphData(graphData)

                    if (data.readStat) {
                        setReadStats(data.readStat)
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
                                >
                                    {readStats.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                                            {readStats.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-lg border bg-card/50 p-4 text-card-foreground shadow-sm flex flex-col items-center justify-center gap-1"
                                                >
                                                    <div className="text-xs text-muted-foreground">{item.stat}</div>
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
