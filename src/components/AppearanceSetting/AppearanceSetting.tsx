import { useEffect, useId } from 'react'

import { CircleHelpIcon } from 'lucide-react'

import { ThemeSelector } from '~/components/ThemeSelector'
import { RadixSwitch } from '~/components/ui-kit/RadixSwitch'
import { RadixToggleGroup } from '~/components/ui-kit/RadixToggleGroup'
import { RadixSelect } from '~/components/ui-kit/RadixSelect'
import { RadixTooltip } from '~/components/ui-kit/RadixTooltip'
import { useData } from '~/DataContext'
import { BlockShape, GraphSize } from '~/enums'
import { trackEvent } from '~/helpers'

import { YearRangeSelect } from './YearRangeSelect'

export function AppearanceSetting(props: { showYearRange?: boolean; showUnit?: boolean } = { showYearRange: true, showUnit: true }) {
  const { showYearRange = true, showUnit = true } = props
  const { graphData, settings, dispatchSettings } = useData()

  const daysLabelId = useId()
  const yearOrderId = useId()
  const safariHeader = useId()
  const attributionId = useId()
  const showCardId = useId()

  return (
    <div className="appearance-setting min-w-[min(40vw,220px)] max-w-[min(90vw,280px)] text-main-400">
      {/* Sync selected options to URL for easy sharing (only new options to avoid noisy URLs) */}
      {(() => {
        // use IIFE to keep hooks order intact
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          try {
            const url = new URL(window.location.href)
            // showCard: include only when false
            if (settings.showCard === false) url.searchParams.set('showCard', 'false')
            else url.searchParams.delete('showCard')
            // yearOrder: include only when desc
            if (settings.yearOrder === 'desc') url.searchParams.set('yearOrder', 'desc')
            else url.searchParams.delete('yearOrder')
            window.history.replaceState({}, '', url.toString())
          } catch {}
        }, [settings.showCard, settings.yearOrder])
        return null
      })()}
      
      {showUnit && (
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
                { label: '米', value: 'meter' },
                { label: '千米', value: 'kilometer' },
              ]}
            />
          </div>
        </fieldset>
      )}
      {showYearRange && (
        <fieldset>
          <label>年份范围</label>
          <YearRangeSelect graphData={graphData} />
        </fieldset>
      )}

      <fieldset className="flex items-center gap-2">
        <label className="shrink-0 text-sm opacity-70" htmlFor={yearOrderId}>年份顺序</label>
        <div className="min-w-[12rem]">
          <RadixSelect
            id={yearOrderId}
            value={settings.yearOrder ?? 'asc'}
            onValueChange={(v) => dispatchSettings({ type: 'yearOrder', payload: v as any })}
            items={[
              { label: '正序（旧→新）', value: 'asc' },
              { label: '倒序（新→旧）', value: 'desc' },
            ]}
          />
        </div>
      </fieldset>

      <fieldset>
        <label htmlFor={daysLabelId}>显示星期标签</label>
        <RadixSwitch
          checked={settings.daysLabel}
          defaultChecked={true}
          id={daysLabelId}
          onCheckedChange={(checked) => {
            dispatchSettings({ type: 'daysLabel', payload: checked })
          }}
        />
      </fieldset>

      <fieldset>
        <label htmlFor={showCardId}>显示外层卡片</label>
        <RadixSwitch
          checked={settings.showCard}
          defaultChecked={true}
          id={showCardId}
          onCheckedChange={(checked) => {
            dispatchSettings({ type: 'showCard', payload: checked })
          }}
        />
      </fieldset>

      {null}

      {/* 隐藏“显示浏览器标题栏”选项，按默认不展示处理 */}

      <fieldset>
        <label htmlFor={attributionId}>显示署名</label>
        <RadixSwitch
          checked={settings.showAttribution}
          defaultChecked={true}
          id={attributionId}
          onCheckedChange={(checked) => {
            dispatchSettings({ type: 'showAttribution', payload: checked })
          }}
        />
      </fieldset>

      <fieldset>
        <label className="flex items-center">
          图表大小
          <RadixTooltip
            label={(
              <span className="inline-block max-w-xs leading-5">也可以通过浏览器缩放调整导出图片尺寸。</span>
            )}
          >
            <CircleHelpIcon className="ml-1 inline-block size-4 cursor-help opacity-90" />
          </RadixTooltip>
        </label>
        <RadixToggleGroup
          options={[
            { label: 'S', value: GraphSize.Small, tooltip: '小' },
            { label: 'M', value: GraphSize.Medium, tooltip: '中' },
            { label: 'L', value: GraphSize.Large, tooltip: '大' },
          ]}
          size="small"
          type="single"
          value={settings.size}
          onValueChange={(size) => {
            dispatchSettings({ type: 'size', payload: size as GraphSize })
          }}
        />
      </fieldset>

      <fieldset>
        <label className="flex items-center">区块形状</label>
        <RadixToggleGroup
          options={[
            {
              label: <span className="inline-block size-4 rounded-[2px] bg-current" />,
              value: BlockShape.Square,
              tooltip: '方形',
            },
            {
              label: <span className="inline-block size-4 rounded-full bg-current" />,
              value: BlockShape.Round,
              tooltip: '圆形',
            },
          ]}
          size="small"
          type="single"
          value={settings.blockShape}
          onValueChange={(shape) => {
            dispatchSettings({ type: 'blockShape', payload: shape as BlockShape })
          }}
        />
      </fieldset>

      <fieldset className="flex-col !items-start">
        <label>主题</label>
        <ThemeSelector
          className="mt-3 pl-1"
          value={settings.theme}
          onChange={(theme) => {
            trackEvent('切换主题', { themeName: theme })
            dispatchSettings({ type: 'theme', payload: theme })
          }}
        />
      </fieldset>
    </div>
  )
}
