import { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react'

import { MockupSafari } from '~/components/mockup/MockupSafari'
import { DEFAULT_SIZE, DEFAULT_THEME, sizeProperties, THEME_PRESETS, THEMES } from '~/constants'
import { useData } from '~/DataContext'
import { BlockShape } from '~/enums'

import { Graph, type GraphProps } from './Graph'
import { GraphFooter } from './GraphFooter'
import { GraphHeader } from './GraphHeader'

interface ContributionsGraphProps extends Pick<GraphProps, 'showInspect' | 'titleRender'> {
  /** Unique ID for the contributions graph container. */
  wrapperId?: string
  /**
   * Custom Mockup component to wrap the contributions graph.
   * @default MockupArc
   */
  Mockup?: React.ComponentType<React.ComponentProps<typeof MockupSafari>>
  /** CSS class name to be applied to the Mockup component. */
  mockupClassName?: string
}

function InnerContributionsGraph(
  props: ContributionsGraphProps,
  ref: React.Ref<HTMLDivElement | null>,
) {
  const { mockupClassName = '', wrapperId, showInspect, titleRender, Mockup = MockupSafari } = props

  const { graphData, settings, firstYear, lastYear } = useData()

  const graphRef = useRef<HTMLDivElement>(null)

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => graphRef.current)

  // Split background theme and cell palette selection
  const backgroundThemeName = settings.themeBackground ?? settings.theme ?? DEFAULT_THEME
  const paletteThemeName = settings.themePalette ?? settings.theme ?? DEFAULT_THEME

  const applyingBackground = useMemo(
    () => THEME_PRESETS.find((item) => item.name.toLowerCase() === backgroundThemeName.toLowerCase()),
    [backgroundThemeName],
  )
  const applyingPalette = useMemo(
    () => THEMES.find((item) => item.name.toLowerCase() === paletteThemeName.toLowerCase()),
    [paletteThemeName],
  )

  if (!graphData) {
    return null
  }

  const themeProperties = applyingBackground && applyingPalette
    ? {
        '--theme-foreground': applyingBackground.colorForeground,
        '--theme-background': applyingBackground.colorBackground,
        '--theme-background-container': applyingBackground.colorBackgroundContainer,
        '--theme-secondary': applyingBackground.colorSecondary,
        '--theme-primary': applyingBackground.colorPrimary,
        '--theme-border': applyingBackground.colorBorder,
        '--level-0': applyingPalette.levelColors[0],
        '--level-1': applyingPalette.levelColors[1],
        '--level-2': applyingPalette.levelColors[2],
        '--level-3': applyingPalette.levelColors[3],
        '--level-4': applyingPalette.levelColors[4],
      }
    : {}

  const cssProperties = {
    ...themeProperties,
    ...sizeProperties[settings.size ?? DEFAULT_SIZE],
    ...(settings.blockShape === BlockShape.Round
      ? {
          '--block-round': '999px',
        }
      : {}),
  }

  return (
    <div
      ref={graphRef}
      id={wrapperId}
      style={{
        ...cssProperties,
        color: 'var(--theme-foreground, #24292f)',
      }}
    >
      <Mockup className={mockupClassName}>
        <div>
          <div className={`px-6 ${settings.showSafariHeader ? 'pt-2' : 'pt-6'}`}>
            <GraphHeader />
          </div>

          <div className="flex flex-col gap-y-6 p-6">
            {graphData.contributionCalendars.map((calendar) => {
              let [startYear, endYear] = settings.yearRange ?? []
              startYear = startYear && Number.isInteger(Number(startYear)) ? startYear : firstYear
              endYear = endYear && Number.isInteger(Number(endYear)) ? endYear : lastYear

              const shouldDisplay
                = startYear && endYear
                  ? calendar.year >= Number(startYear) && calendar.year <= Number(endYear)
                  : true

              return (
                <Graph
                  key={calendar.year}
                  className={shouldDisplay ? '' : 'hidden'}
                  data={calendar}
                  daysLabel={settings.daysLabel}
                  showInspect={showInspect}
                  titleRender={titleRender}
                />
              )
            })}
          </div>

          {settings.showAttribution && (
            <div className="border-t-[1.5px] border-t-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] px-6 py-3">
              <GraphFooter />
            </div>
          )}
        </div>
      </Mockup>
    </div>
  )
}

export const ContributionsGraph = memo(forwardRef(InnerContributionsGraph))
