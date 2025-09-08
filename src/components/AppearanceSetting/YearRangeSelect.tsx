import { RadixSelect } from '~/components/ui-kit/RadixSelect'
import { useData } from '~/DataContext'
import type { GraphData, GraphSettings } from '~/types'

interface YearRangeSelectProps {
  graphData: GraphData | undefined
}

export function YearRangeSelect(props: YearRangeSelectProps) {
  const { graphData } = props

  const { settings, dispatchSettings, firstYear, lastYear } = useData()

  let [startYear, endYear] = settings.yearRange ?? []
  startYear ??= firstYear
  endYear ??= lastYear

  if (!startYear || !endYear) {
    return null
  }

  // Build available years from graphData when present; otherwise derive from settings.yearRange
  const buildYearsFromRange = (start?: string, end?: string) => {
    if (!start || !end) return undefined as number[] | undefined
    const s = Number(start)
    const e = Number(end)
    if (!Number.isInteger(s) || !Number.isInteger(e)) return undefined
    const min = Math.min(s, e)
    const max = Math.max(s, e)
    const arr: number[] = []
    for (let y = min; y <= max; y++) arr.push(y)
    return arr
  }

  const availableYears
    = graphData?.contributionYears
    ?? buildYearsFromRange(settings.yearRange?.[0], settings.yearRange?.[1])
    ?? []

  const handleYearChange = (se: 'start' | 'end', year: string) => {
    let payload: GraphSettings['yearRange'] = undefined

    if (se === 'start') {
      payload = [year, endYear]
    }

    if (se === 'end') {
      payload = [startYear, year]
    }

    dispatchSettings({
      type: 'yearRange',
      payload,
    })
  }

  return (
    <div className="flex items-center">
      <RadixSelect
        items={availableYears.map((year) => ({
          label: `${year}`,
          value: `${year}`,
          disabled: year > Number(endYear),
        }))}
        value={startYear}
        onValueChange={handleYearChange.bind(null, 'start')}
      />
      <span className="mx-2">-</span>
      <RadixSelect
        items={availableYears.map((year) => ({
          label: `${year}`,
          value: `${year}`,
          disabled: year < Number(startYear),
        }))}
        value={endYear}
        onValueChange={handleYearChange.bind(null, 'end')}
      />
    </div>
  )
}
