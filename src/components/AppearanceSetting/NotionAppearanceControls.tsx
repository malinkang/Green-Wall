import React from 'react'

import GenerateButton from '~/components/GenerateButton'
import { RadixSelect } from '~/components/ui-kit/RadixSelect'

export function NotionAppearanceControls(props: {
  // Auth and database selection
  authChecked: boolean
  databases: { id: string; title: string }[] | null
  dbLoading: boolean
  databaseId: string
  setDatabaseId: (v: string) => void
  // Notion properties
  dateProp: string
  setDateProp: (v: string) => void
  countProp: string
  setCountProp: (v: string) => void
  dateCandidates: string[]
  numberCandidates: string[]
  // Actions
  loading?: boolean
  onGenerate: () => void
}) {
  const COUNT_NONE = '__NONE__'
  const {
    authChecked,
    databases,
    dbLoading,
    databaseId,
    setDatabaseId,
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
    <div className="mb-4">
      <div className="mb-2 text-sm font-medium text-main-500">Notion 设置</div>

      <div className="flex flex-col gap-3">
        <fieldset className="flex items-center gap-2">
          <label className="shrink-0 text-sm opacity-70">数据库</label>
          <div className="min-w-[12rem]">
            {!authChecked ? (
              <div className="text-sm opacity-70">正在检查 Notion 登录…</div>
            ) : databases === null ? (
              <a
                className="inline-flex items-center rounded-md bg-main-100 px-3 py-1.5 text-sm font-medium text-main-600 hover:bg-main-200"
                href="/api/auth/notion/login"
              >
                使用 Notion 登录
              </a>
            ) : (
              <RadixSelect
                value={databaseId}
                onValueChange={setDatabaseId}
                items={(databases || []).map(d => ({ label: d.title, value: d.id }))}
                disabled={dbLoading}
              />
            )}
          </div>
        </fieldset>
        <fieldset className="flex items-center gap-2">
          <label className="shrink-0 text-sm opacity-70">日期属性</label>
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
          <label className="shrink-0 text-sm opacity-70">数值属性</label>
          <div className="min-w-[12rem]">
            <RadixSelect
              value={countProp || COUNT_NONE}
              onValueChange={(v) => setCountProp(v === COUNT_NONE ? '' : v)}
              items={[{ label: '无', value: COUNT_NONE }, ...numberCandidates.map(n => ({ label: n, value: n }))]}
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
