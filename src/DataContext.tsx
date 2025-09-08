'use client'

import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react'

import { DEFAULT_THEME, THEME_PRESETS } from '~/constants'
import { useGraphSetting } from '~/hooks/useGraphSetting'
import type { GitHubUsername, GraphData, GraphSettings, ThemePreset } from '~/types'

type DispatchSettings = ReturnType<typeof useGraphSetting>[1]

interface SettingContextData {
  username: GitHubUsername
  graphData: GraphData | undefined
  setGraphData: Dispatch<SetStateAction<GraphData | undefined>>
  settings: GraphSettings
  dispatchSettings: DispatchSettings
  firstYear: string | undefined
  lastYear: string | undefined
  totalYears: number | undefined
  totalContributions: number | undefined
  applyingTheme: ThemePreset | undefined
}

const Setting = createContext({} as SettingContextData)

export function DataProvider(props: React.PropsWithChildren) {
  const { children } = props

  const [graphData, setGraphData] = useState<GraphData>()

  const [settings, dispatchSettings] = useGraphSetting()

  // Years array is ascending (oldest -> newest). Ensure labels align:
  const firstYear = graphData?.contributionYears.at(0)?.toString()
  const lastYear = graphData?.contributionYears.at(-1)?.toString()

  const totalYears = graphData?.contributionYears.length

  const totalContributions = graphData?.contributionCalendars.reduce(
    (sum, calendar) => sum + calendar.total,
    0,
  )

  const applyingTheme = useMemo(
    () =>
      THEME_PRESETS.find(
        (item) => item.name.toLowerCase() === (settings.theme ?? DEFAULT_THEME).toLowerCase(),
      ),
    [settings.theme],
  )

  return (
    <Setting.Provider
      value={{
        username: graphData?.login ?? '',
        graphData,
        setGraphData,
        settings,
        dispatchSettings,
        firstYear,
        lastYear,
        totalYears,
        totalContributions,
        applyingTheme,
      }}
    >
      {children}
    </Setting.Provider>
  )
}

export function useData() {
  return useContext(Setting)
}
