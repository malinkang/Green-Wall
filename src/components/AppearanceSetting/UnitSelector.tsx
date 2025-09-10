import { RadixSelect } from '~/components/ui-kit/RadixSelect'
import { useData } from '~/DataContext'

export function UnitSelector() {
  const { settings, dispatchSettings } = useData()

  return (
    <fieldset className="flex items-center gap-2">
      <label className="shrink-0 text-sm opacity-70">单位</label>
      <div className="min-w-[12rem]">
        <RadixSelect
          value={(settings.unit as string) || 'contributions'}
          onValueChange={(unit) => dispatchSettings({ type: 'unit', payload: unit as any })}
          items={[
            { label: '次（默认）', value: 'contributions' },
            { label: '秒', value: 'second' },
            { label: '分钟', value: 'minute' },
            { label: '小时', value: 'hour' },
            { label: '天', value: 'day' },
            { label: '米', value: 'meter' },
            { label: '千米', value: 'kilometer' },
          ]}
        />
      </div>
    </fieldset>
  )
}
