"use client"

import { useEffect, useState } from 'react'
import { RadixPopover } from '~/components/ui-kit/RadixPopover'

type NotionMe = {
  name?: string
  avatar_url?: string
}

export function GitHubButton() {
  const [me, setMe] = useState<NotionMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    const cleanupUrl = () => {
      if (code || error) {
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('error')
        window.history.replaceState({}, '', url.pathname + url.search + url.hash)
      }
    }

    const fetchMe = async () => {
      try {
        const res = await fetch('/api/notion/me', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          setMe({ name: json?.name || json?.bot?.owner?.workspace_name, avatar_url: json?.avatar_url })
        } else {
          setMe(null)
        }
      } finally {
        setLoading(false)
      }
    }

    const exchangeAndFetch = async () => {
      if (code) {
        try {
          const res = await fetch(`/api/auth/notion/exchange?code=${encodeURIComponent(code)}`)
          if (res.ok) {
            // notify other parts to refresh auth-dependent data
            window.dispatchEvent(new Event('notion-auth-success'))
            await fetchMe()
          } else {
            setMe(null)
          }
        } finally {
          cleanupUrl()
        }
      } else {
        await fetchMe()
      }
    }

    void exchangeAndFetch()
  }, [])

  if (loading) {
    return (
      <div className="ml-auto">
        <button className="flex items-center rounded-full bg-main-100 px-3 py-2 text-sm font-medium text-main-500 ring-4 ring-pageBg md:ring-8 opacity-60">
          Loading…
        </button>
      </div>
    )
  }

  if (me) {
    return (
      <div className="ml-auto">
        <RadixPopover
          title={undefined}
          content={(
            <div className="flex flex-col gap-2">
              <button
                className="inline-flex items-center rounded bg-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-200"
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/notion/logout', { method: 'POST' })
                  } catch {}
                  window.location.reload()
                }}
              >
                退出登录
              </button>
            </div>
          )}
        >
          <button
            title={me.name || 'Notion user'}
            className="flex size-9 items-center justify-center overflow-hidden rounded-full ring-4 ring-pageBg md:size-10 md:ring-8"
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={me.avatar_url || '/favicon.svg'} alt="avatar" className="h-full w-full object-cover" />
          </button>
        </RadixPopover>
      </div>
    )
  }

  return (
    <a className="ml-auto" href="/api/auth/notion/login">
      <button className="flex items-center rounded-md bg-main-100 px-3 py-2 text-sm font-medium text-main-500 ring-4 ring-pageBg transition-colors duration-300 hover:bg-main-200 md:ring-8">
        <svg className="size-4" viewBox="0 0 24 24">
          <path
            d="M4.459 3.083c.906-.241 2.098-.023 3.14.281l9.63 2.793c1.1.319 1.808.72 1.808 1.663v10.305c0 .88-.493 1.311-1.6 1.6l-9.838 2.593c-1.247.327-2.255.292-3.245 0L2.59 21.68C1.616 21.39 1 20.9 1 19.78V6.3c0-1.117.637-1.86 1.69-2.144l1.77-.473Zm.383 1.356-1.3.348c-.527.141-.836.46-.836 1.133v13.213c0 .603.232.85.86 1.034l1.24.354c.71.202 1.383.201 2.184-.012l9.54-2.514c.8-.211 1.045-.497 1.045-1.164V7.856c0-.62-.269-.9-1.045-1.12L7.343 3.936c-.89-.252-1.64-.285-2.5-.102Zm2.032 2.08 8.943 2.538v8.787L6.874 20.62V6.52Zm1.238 1.69v9.02l1.516-.36v-6.54l3.36 8.19 1.428-.34V8.178l-1.5.287v6.31l-3.203-7.716-2.1.458Z"
            fill="currentColor"
          />
        </svg>
        <span className="ml-2">使用 Notion 登录</span>
      </button>
    </a>
  )
}
