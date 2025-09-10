import React from 'react'

import GenerateButton from '~/components/GenerateButton'
import { RadixSelect } from '~/components/ui-kit/RadixSelect'
import { RadixPopover } from '~/components/ui-kit/RadixPopover'

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
  children?: React.ReactNode
}) {
  const COUNT_NONE = '__NONE__'
  const [user, setUser] = React.useState<{ name?: string; avatar_url?: string } | null>(null)
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

  React.useEffect(() => {
    // fetch Notion user after auth check
    const run = async () => {
      try {
        const res = await fetch('/api/notion/me', { cache: 'no-store' })
        if (!res.ok) return setUser(null)
        const json = await res.json()
        setUser({ name: json?.name, avatar_url: json?.avatar_url })
      } catch { setUser(null) }
    }
    if (authChecked && databases !== null) run()
  }, [authChecked, databases])

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center justify-center gap-2">
          {user ? (
            <div className="flex flex-col items-center">
              {/* Avatar + name centered; click avatar to open actions */}
              <div className="mb-1">
                <RadixPopover
                  content={(
                    <div className="flex flex-col gap-2">
                      <button
                        className="inline-flex items-center rounded bg-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-200"
                        type="button"
                        onClick={async () => {
                          try { await fetch('/api/notion/logout', { method: 'POST' }) } catch {}
                          try { window.location.reload() } catch {}
                        }}
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                >
                  <button type="button" title="账户操作" className="rounded-full">
                    <img
                      alt={user.name ?? 'Notion User'}
                      src={user.avatar_url ?? '/favicon.svg'}
                      className="h-12 w-12 rounded-full border border-[var(--theme-border)] object-cover"
                    />
                  </button>
                </RadixPopover>
              </div>
              <div className="text-center text-sm font-medium leading-tight">{user.name || 'Notion 用户'}</div>
            </div>
          ) : (
            <a href="/api/auth/notion/login" className="select-none text-white">
              <span className="relative inline-block min-w-[max(30vw,200px)] rounded-[12px] bg-accent-500 px-4 py-2 text-center text-lg font-medium shadow md:min-w-[120px] md:text-base">
                使用 Notion 登录
              </span>
            </a>
          )}
        </div>
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

        {props.children}

        <div className="flex w-full justify-center">
          <GenerateButton loading={!!loading} type="button" onClick={onGenerate} />
        </div>
      </div>
    </div>
  )
}
