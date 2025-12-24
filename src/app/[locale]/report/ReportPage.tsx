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

export function ReportPage() {
    const t = useTranslations('home') // Reuse home translations for now or create new ones
    const graphRef = useRef<HTMLDivElement>(null)

    const settingPopoverContentId = useId()
    const graphWrapperId = useId()

    const { graphData, setGraphData, isLoading: isGlobalLoading } = useData()

    const {
        settingPopupPosition,
        closeSettingPopup,
        graphActionsRefCallback,
        handleSettingPopOut,
    } = useSettingPopup(graphWrapperId)

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Load data from localStorage
        const loadReportData = () => {
            try {
                const storedData = localStorage.getItem('weread_report_data')
                const storedYear = localStorage.getItem('weread_report_year')
                const currentUser = localStorage.getItem('weread_user')

                if (storedData) {
                    const data = JSON.parse(storedData)
                    let user = { name: 'WeRead User', avatar: '' }
                    if (currentUser) {
                        user = JSON.parse(currentUser)
                    }

                    // Transform data for the graph
                    // Assuming transformWeReadDataToGraphData handles the format from get-weread-detail
                    // The structure in a.json matches what fetchWeReadSummary returned in previous steps roughly?
                    // Actually a.json has `readTimes` (monthly?) and `dailyReadTimes`. 
                    // `transformWeReadDataToGraphData` expects `WeReadSummaryResponse`. 
                    // Let's check `transformWeReadDataToGraphData` next to be sure.
                    // But for now, we assume it works or we might need to adjust the transformer.
                    // dailyReadTimes in a.json uses timestamps as keys.

                    const graphData = transformWeReadDataToGraphData(data, user.name, user.avatar)
                    setGraphData(graphData)
                }
            } catch (e) {
                console.error("Failed to load report data", e)
            } finally {
                setIsLoading(false)
            }
        }

        loadReportData()
    }, [setGraphData])


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

        if (showLoading || graphData) {
            return (
                <Loading active={showLoading}>
                    {graphData && (
                        <>
                            <div
                                ref={graphActionsRefCallback}
                                className="flex flex-row-reverse flex-wrap items-center justify-center gap-x-6 gap-y-4 py-5"
                            >
                                <GraphActionBar
                                    graphRef={graphRef}
                                    settingPopoverContentId={settingPopoverContentId}
                                    settingPopupPosition={settingPopupPosition}
                                    username={graphData.login}
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
                                />
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
                {/* Title could be dynamic based on year */}
                微信读书年度回顾
            </h1>

            {renderContent()}
        </div>
    )
}
