import { useCallback, useState } from 'react'

import { useData } from '~/DataContext'
import { getLocalExternalId, getNeonUserId, setNeonUserId } from '~/lib/userStore'

export function SettingsPersistence() {
  const { graphData, settings, dispatchSettings } = useData()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const ensureUserId = useCallback(async (): Promise<string> => {
    const existing = getNeonUserId()
    if (existing) return existing
    const external_id = getLocalExternalId()
    const res = await fetch('/api/neon/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_id,
        name: graphData?.name,
        avatar_url: graphData?.avatarUrl,
      }),
    })
    if (!res.ok) throw new Error('创建用户失败')
    const json = await res.json() as any
    const id = json.user?.id as string
    if (!id) throw new Error('无效用户返回')
    setNeonUserId(id)
    return id
  }, [graphData])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      setStatus(null)
      const userId = await ensureUserId()
      const body = {
        unit: settings.unit,
        title_override: settings.titleOverride,
        subtitle_override: settings.subtitleOverride,
        avatar_url: settings.avatarUrl,
        logo_url: settings.logoUrl,
        theme: settings.theme,
        size: settings.size,
        block_shape: settings.blockShape,
        days_label: settings.daysLabel,
        show_attribution: settings.showAttribution,
        show_safari_header: settings.showSafariHeader,
        show_card: settings.showCard,
        year_order: settings.yearOrder,
        year_start: settings.yearRange?.[0] ?? null,
        year_end: settings.yearRange?.[1] ?? null,
      }
      const res = await fetch(`/api/neon/users/${encodeURIComponent(userId)}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('保存失败')
      setStatus('已保存')
      setTimeout(() => setStatus(null), 1500)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '保存失败')
      setTimeout(() => setStatus(null), 2000)
    } finally {
      setSaving(false)
    }
  }, [ensureUserId, settings])

  const handleLoad = useCallback(async () => {
    const userId = getNeonUserId()
    if (!userId) {
      setStatus('尚未创建用户，先保存一次')
      setTimeout(() => setStatus(null), 2000)
      return
    }
    try {
      setLoading(true)
      setStatus(null)
      const res = await fetch(`/api/neon/users/${encodeURIComponent(userId)}/settings`)
      if (!res.ok) throw new Error('加载失败')
      const json = await res.json() as any
      const s = json.settings as any
      if (!s) {
        setStatus('暂无已保存设置')
        setTimeout(() => setStatus(null), 1500)
        return
      }
      dispatchSettings({ type: 'replace', payload: {
        unit: s.unit ?? settings.unit,
        titleOverride: s.title_override ?? settings.titleOverride,
        subtitleOverride: s.subtitle_override ?? settings.subtitleOverride,
        avatarUrl: s.avatar_url ?? settings.avatarUrl,
        logoUrl: s.logo_url ?? settings.logoUrl,
        theme: s.theme ?? settings.theme,
        size: s.size ?? settings.size,
        blockShape: s.block_shape ?? settings.blockShape,
        daysLabel: s.days_label ?? settings.daysLabel,
        showAttribution: s.show_attribution ?? settings.showAttribution,
        showSafariHeader: s.show_safari_header ?? settings.showSafariHeader,
        showCard: s.show_card ?? settings.showCard,
        yearOrder: s.year_order ?? settings.yearOrder,
        yearRange: [s.year_start ?? undefined, s.year_end ?? undefined],
      } as any })
      setStatus('已加载')
      setTimeout(() => setStatus(null), 1500)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '加载失败')
      setTimeout(() => setStatus(null), 2000)
    } finally {
      setLoading(false)
    }
  }, [dispatchSettings, settings])

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        className="inline-flex items-center rounded bg-main-100 px-2 py-1 text-sm text-main-600 hover:bg-main-200 disabled:opacity-50"
        disabled={saving}
        onClick={() => void handleSave()}
        type="button"
      >
        {saving ? '保存中…' : '保存设置'}
      </button>
      <button
        className="inline-flex items-center rounded bg-main-100 px-2 py-1 text-sm text-main-600 hover:bg-main-200 disabled:opacity-50"
        disabled={loading}
        onClick={() => void handleLoad()}
        type="button"
      >
        {loading ? '加载中…' : '加载设置'}
      </button>
      {status && <span className="text-xs text-main-500">{status}</span>}
    </div>
  )
}
