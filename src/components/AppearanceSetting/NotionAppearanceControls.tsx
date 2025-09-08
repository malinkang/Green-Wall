import React from 'react'

import GenerateButton from '~/components/GenerateButton'
import { RadixSelect } from '~/components/ui-kit/RadixSelect'

export function NotionAppearanceControls(props: {
  dateProp: string
  setDateProp: (v: string) => void
  countProp: string
  setCountProp: (v: string) => void
  dateCandidates: string[]
  numberCandidates: string[]
  loading?: boolean
  onGenerate: () => void
}) {
  const COUNT_NONE = '__NONE__'
  const {
    dateProp,
    setDateProp,
    countProp,
    setCountProp,
    dateCandidates,
    numberCandidates,
    loading,
    onGenerate,
  } = props

  return (
    <div className="mt-4 border-t border-[color-mix(in_srgb,var(--theme-border,_#d0d7de)_50%,transparent)] pt-4">
      <div className="mb-2 text-sm font-medium text-main-500">Notion</div>

      <div className="flex flex-col gap-3">
        <fieldset className="flex items-center gap-2">
          <label className="shrink-0 text-sm opacity-70">Date prop</label>
          <div className="min-w-[12rem]">
            <RadixSelect
              value={dateProp}
              onValueChange={setDateProp}
              items={dateCandidates.map(n => ({ label: n, value: n }))}
              disabled={!dateCandidates.length}
            />
          </div>
        </fieldset>

        <fieldset className="flex items-center gap-2">
          <label className="shrink-0 text-sm opacity-70">Count prop</label>
          <div className="min-w-[12rem]">
            <RadixSelect
              value={countProp || COUNT_NONE}
              onValueChange={(v) => setCountProp(v === COUNT_NONE ? '' : v)}
              items={[{ label: 'None', value: COUNT_NONE }, ...numberCandidates.map(n => ({ label: n, value: n }))]}
            />
          </div>
        </fieldset>

        <div>
          <GenerateButton loading={!!loading} type="button" onClick={onGenerate} />
        </div>
      </div>
    </div>
  )
}

