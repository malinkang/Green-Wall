'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { toBlob, toPng } from 'html-to-image'
import { DotIcon, FileCheck2Icon, ImageIcon, ImagesIcon } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

import { AppearanceSetting } from '~/components/AppearanceSetting'
import { NotionAppearanceControls } from '~/components/AppearanceSetting/NotionAppearanceControls'
import { AppearanceSidebar } from '~/components/AppearanceSetting/AppearanceSidebar'
import { UnitSelector } from '~/components/AppearanceSetting/UnitSelector'
import { YearRangeSelect } from '~/components/AppearanceSetting/YearRangeSelect'
import { NotionShareButton } from '~/components/NotionShareButton'
import { ContributionsGraph } from '~/components/ContributionsGraph'
import { ErrorMessage } from '~/components/ErrorMessage'
import Loading from '~/components/Loading'
// import { SettingButton } from '~/components/SettingButton'
import { useData } from '~/DataContext'
import { trackEvent } from '~/helpers'
import { useNotionRequest } from '~/hooks/useNotionRequest'
// database selection moved into Appearance panel

function Divider() {
  return (
    <div className="my-4 flex items-center justify-center gap-x-2 text-main-200">
      <span className="h-px w-1/3 bg-gradient-to-l from-current to-transparent" />
      <DotIcon className="size-4 text-main-300" />
      <span className="h-px w-1/3 bg-gradient-to-r from-current to-transparent" />
    </div>
  )
}

export function NotionHome() {
  const canUseClipboardItem = typeof ClipboardItem !== 'undefined'

  const graphRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<HTMLDivElement | null>(null)

  const { graphData, setGraphData, dispatchSettings, settings } = useData()
  const [databaseId, setDatabaseId] = useState('')
  const [dateProp, setDateProp] = useState('')
  const [countProp, setCountProp] = useState('')
  const [databases, setDatabases] = useState<{ id: string, title: string }[] | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  // removed search query state
  const [authChecked, setAuthChecked] = useState(false)
  const [dateCandidates, setDateCandidates] = useState<string[]>([])
  const [numberCandidates, setNumberCandidates] = useState<string[]>([])

  const [appearanceOpen, setAppearanceOpen] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [doingCopy, setDoingCopy] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // react-hot-toast global toaster is rendered below; use toast(...) to notify

  const reset = () => {
    // Do not reset settings to preserve Notion-detected year range and user preferences
    setGraphData(undefined)
  }

  const handleError = () => {
    reset()
  }

  const { run, loading, error } = useNotionRequest({ onError: handleError })

  const loadDatabases = useCallback(async (_q?: string) => {
    try {
      setDbLoading(true)
      const url = '/api/notion/databases'
      const res = await fetch(url)
      if (res.status === 401) {
        setDatabases(null)
      } else if (res.ok) {
        const json = await res.json() as { databases: { id: string, title: string }[] }
        setDatabases(json.databases)
      }
    } finally {
      setDbLoading(false)
      setAuthChecked(true)
    }
  }, [])

  // Check login and load databases
  useEffect(() => { void loadDatabases() }, [loadDatabases])

  // No debounce (no search box)

  // Load date/number property candidates when database changes
  useEffect(() => {
    const loadProps = async () => {
      if (!databaseId) {
        setDateCandidates([])
        setNumberCandidates([])
        setDateProp('')
        setCountProp('')
        return
      }
      const res = await fetch(`/api/notion/databases/${encodeURIComponent(databaseId)}/properties`)
      if (res.ok) {
        const json = await res.json() as { dateProps: { name: string }[], numberProps: { name: string }[] }
        const ds = json.dateProps.map(p => p.name)
        const ns = json.numberProps.map(p => p.name)
        setDateCandidates(ds)
        setNumberCandidates(ns)
        // Randomly pick defaults (when available) per TODO
        const randomPick = (arr: string[]) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : '')
        const defaultDate = randomPick(ds)
        const defaultCount = randomPick(ns)
        setDateProp(prev => prev || defaultDate)
        setCountProp(prev => prev || defaultCount)
        // toast if missing expected properties
        if (ds.length === 0) toast.error('所选数据库没有日期属性，请检查 Notion 数据库。')
        if (ns.length === 0) toast('所选数据库没有数值属性（可选），如需计数请添加一个 Number 属性。')
      } else {
        setDateCandidates([])
        setNumberCandidates([])
        setDateProp('')
        setCountProp('')
        toast.error('无法读取数据库属性，请重试或检查权限。')
      }
    }
    void loadProps()
  }, [databaseId])

  // Auto-detect earliest and latest years from Notion and set year range
  useEffect(() => {
    const setYearRangeFromNotion = async () => {
      // Only fetch range when database, date property and count property are all selected
      if (!databaseId || !dateProp || !countProp) return
      try {
        const q = new URLSearchParams({ dateProp })
        if (countProp) q.set('countProp', countProp)
        const res = await fetch(`/api/notion/databases/${encodeURIComponent(databaseId)}/range?${q.toString()}`)
        if (!res.ok) return
        const json = await res.json() as { startYear?: number; endYear?: number }
        const start = json.startYear?.toString()
        const end = json.endYear?.toString()
        if (start && end) {
          dispatchSettings({ type: 'yearRange', payload: [start, end] })
        }
      } catch {
        // ignore
      }
    }
    void setYearRangeFromNotion()
  }, [databaseId, dateProp, countProp, dispatchSettings])

  // Refresh databases after successful auth (triggered by header)
  useEffect(() => {
    const handler = () => { void loadDatabases() }
    window.addEventListener('notion-auth-success', handler)
    return () => window.removeEventListener('notion-auth-success', handler)
  }, [loadDatabases])

  // If logged in (databases loaded), sync Notion user into Neon (no settings persistence)
  useEffect(() => {
    const syncNotionUser = async () => {
      try {
        await fetch('/api/neon/notion/sync', { method: 'POST' })
      } catch {}
    }
    if (authChecked && databases) {
      void syncNotionUser()
    }
  }, [authChecked, databases])

  const handleSubmit = async () => {
    const db = databaseId.trim()
    if (!db || loading) return

    reset()
    trackEvent('Click Generate Notion')
    // Build years array from current settings.yearRange if available
    let years: number[] | undefined
    const [startY, endY] = settings.yearRange ?? []
    if (startY && endY && Number.isInteger(Number(startY)) && Number.isInteger(Number(endY))) {
      const a = Number(startY)
      const b = Number(endY)
      const min = Math.min(a, b)
      const max = Math.max(a, b)
      years = []
      for (let y = min; y <= max; y++) years.push(y)
    }
    const data = await run({ databaseId: db, dateProp: dateProp.trim() || 'Date', countProp: countProp.trim() || undefined, years })
    setGraphData(data)
  }

  const handleDownload = async () => {
    if (graphRef.current && graphData && !downloading) {
      try {
        setDownloading(true)
        trackEvent('Click Download Notion')

        const dataURL = await toPng(graphRef.current, { cacheBust: true, useCORS: true })
        const trigger = document.createElement('a')
        trigger.href = dataURL
        trigger.download = `${graphData.login}_notion_heatmap`
        trigger.click()
      }
      finally {
        setTimeout(() => setDownloading(false), 1500)
      }
    }
  }

  const handleCopyImage = async () => {
    if (graphRef.current && graphData && canUseClipboardItem && !doingCopy) {
      try {
        setDoingCopy(true)
        trackEvent('Click Copy Image Notion')
        const item = new ClipboardItem({
          'image/png': (async () => {
            if (!graphRef.current) throw new Error('no-ref')
            const blobData = await toBlob(graphRef.current, { cacheBust: true, useCORS: true })
            if (!blobData) throw new Error('no-blob')
            return blobData
          })(),
        })
        await navigator.clipboard.write([item])
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 1500)
      }
      finally {
        setDoingCopy(false)
      }
    }
  }

  const graphWrapperId = useId()

  const actionRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      actionRef.current = node
      if (actionRef.current) {
        const offsetTop = actionRef.current.getBoundingClientRect().top
        if (offsetTop > 0) document.body.scrollTo({ left: 0, top: offsetTop, behavior: 'smooth' })
        // No auto pop-out in sidebar mode
      }
    },
    [graphWrapperId],
  )

  const SIDEBAR_WIDTH = 320
  return (
    <div className="relative">
      {/* global toaster for notifications */}
      <Toaster position="bottom-center" toastOptions={{ duration: 2800 }} />
      <AppearanceSidebar open={appearanceOpen} width={SIDEBAR_WIDTH}>
        <NotionAppearanceControls
          authChecked={authChecked}
          databases={databases}
          dbLoading={dbLoading}
          databaseId={databaseId}
          setDatabaseId={setDatabaseId}
          dateProp={dateProp}
          setDateProp={(v) => {
            setDateProp(v)
            const y = new Date().getFullYear().toString()
            dispatchSettings({ type: 'yearRange', payload: [y, y] })
          }}
          countProp={countProp}
          setCountProp={setCountProp}
          dateCandidates={dateCandidates}
          numberCandidates={numberCandidates}
          loading={loading}
          onGenerate={() => void handleSubmit()}
        >
          {/* Keep unit selector here; avatar/logo/title/subtitle moved to AppearanceSetting */}
          <UnitSelector />
          <div className="mt-1">
            <fieldset className="flex items-center gap-2">
              <label className="shrink-0 text-sm opacity-70">年份范围</label>
              <YearRangeSelect graphData={graphData} />
            </fieldset>
          </div>
        </NotionAppearanceControls>
        <AppearanceSetting showYearRange={false} showUnit={false} />
      </AppearanceSidebar>

      <div className="py-10 md:py-14" style={{ marginLeft: appearanceOpen ? SIDEBAR_WIDTH + 16 : 0 }}>
      <h1 className="sr-only">Turn your Notion database into a contributions heatmap.</h1>

      {/* Appearance sidebar is always open by default; removed toggle button section */}

      {/* Global Appearance panel (available before/after generating) */}
      {/* Sidebar mounted above; no overlay */}

      {error ? (
        <ErrorMessage errorType={error.errorType} text={error.message} />
      ) : (
        <Loading active={loading}>
          {graphData && (
            <>
              <div ref={actionRefCallback} className="flex flex-row-reverse flex-wrap items-center justify-center gap-x-6 gap-y-4 py-5">
                <div className="flex gap-x-3">
                  <button
                    className="inline-flex h-full items-center rounded-md bg-main-100 px-4 py-2 text-sm font-medium text-main-500 hover:bg-main-200 disabled:pointer-events-none motion-safe:transition-colors motion-safe:duration-300 md:text-base"
                    disabled={downloading}
                    onClick={() => void handleDownload()}
                  >
                    <ImageIcon className="mr-2 size-4 shrink-0 md:size-5" />
                    <span>保存为图片</span>
                  </button>
                  {canUseClipboardItem && (
                    <button
                      className={`${
                        copySuccess
                          ? 'bg-accent-100 text-accent-500'
                          : 'bg-main-100 text-main-500 duration-300 hover:bg-main-200 motion-safe:transition-colors'
                      } inline-flex h-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none md:text-base`}
                      disabled={doingCopy}
                      onClick={() => void handleCopyImage()}
                    >
                      {copySuccess ? (
                        <>
                          <FileCheck2Icon className="mr-2 size-4 shrink-0 md:size-5" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <ImagesIcon className="mr-2 size-4 shrink-0 md:size-5" />
                          <span>复制图片</span>
                        </>
                      )}
                    </button>
                  )}
                  {!!databaseId && !!dateProp && (
                    <NotionShareButton databaseId={databaseId} dateProp={dateProp} countProp={countProp || undefined} />
                  )}
                </div>

                {/* Appearance sidebar open by default; no toggle button here */}
              </div>

              <Divider />

              <div className="relative mx-auto max-w-max">
                <div id={graphWrapperId} className="relative z-10">
                  <ContributionsGraph ref={graphRef} showInspect={false} />
                </div>
              </div>
            </>
          )}
        </Loading>
      )}
      </div>
    </div>
  )
}
