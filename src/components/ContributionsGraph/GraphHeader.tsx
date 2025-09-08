import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { AtSignIcon, DotIcon, UserIcon } from 'lucide-react'

import { useData } from '~/DataContext'
import { GraphSize } from '~/enums'
import { numberWithCommas } from '~/helpers'

const GitHubIcon = () => {
  return (
    <svg viewBox="0 0 24 24">
      <path
        clipRule="evenodd"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
        fill="currentcolor"
        fillRule="evenodd"
      />
    </svg>
  )
}

const NotionIcon = () => {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M4.459 3.083c.906-.241 2.098-.023 3.14.281l9.63 2.793c1.1.319 1.808.72 1.808 1.663v10.305c0 .88-.493 1.311-1.6 1.6l-9.838 2.593c-1.247.327-2.255.292-3.245 0L2.59 21.68C1.616 21.39 1 20.9 1 19.78V6.3c0-1.117.637-1.86 1.69-2.144l1.77-.473Zm.383 1.356-1.3.348c-.527.141-.836.46-.836 1.133v13.213c0 .603.232.85.86 1.034l1.24.354c.71.202 1.383.201 2.184-.012l9.54-2.514c.8-.211 1.045-.497 1.045-1.164V7.856c0-.62-.269-.9-1.045-1.12L7.343 3.936c-.89-.252-1.64-.285-2.5-.102Zm2.032 2.08 8.943 2.538v8.787L6.874 20.62V6.52Zm1.238 1.69v9.02l1.516-.36v-6.54l3.36 8.19 1.428-.34V8.178l-1.5.287v6.31l-3.203-7.716-2.1.458Z"
        fill="currentColor"
      />
    </svg>
  )
}

const Avatar = () => {
  const { graphData } = useData()

  const init = useRef(false)
  const avatarRoot = useRef<HTMLSpanElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>()

  useEffect(() => {
    const root = avatarRoot.current

    // Dynamically load and append the avatar image:
    // 1. Shows loading state while fetching
    // 2. Handles successful load by appending img to container
    // 3. Shows fallback UI on error
    // 4. Uses ref to prevent multiple loads
    if (root && graphData && !init.current) {
      if (!root.hasChildNodes()) {
        setStatus('loading')

        const avatarImg = new window.Image()
        try {
          avatarImg.crossOrigin = 'anonymous'
        } catch {}

        avatarImg.onload = () => {
          root.appendChild(avatarImg)
          setStatus('loaded')
        }

        avatarImg.onerror = () => {
          setStatus('error')
        }

        avatarImg.src = graphData.avatarUrl
        avatarImg.alt = `${graphData.login}'s avatar.`
        avatarImg.classList.add('h-full', 'w-full')
        init.current = true
      }
    }
  }, [graphData])

  return (
    <span
      ref={avatarRoot}
      className={`size-full overflow-hidden rounded-full bg-[var(--level-0)] ${
        status === 'loading' ? 'animate-pulse' : ''
      }`}
    >
      {status === 'error' && (
        <span className="inline-block size-full bg-gradient-to-br from-[var(--level-1)] to-[var(--level-2)]" />
      )}
    </span>
  )
}

export function GraphHeader() {
  const { graphData, lastYear, totalYears, totalContributions, settings } = useData()

  if (!graphData) {
    return null
  }

  const username = graphData.login
  const href = graphData.profileUrl ?? `https://github.com/${username}`
  const source = graphData.source ?? 'github'

  const unitLabel = (() => {
    switch (settings.unit) {
      case 'second': return '秒'
      case 'minute': return '分钟'
      case 'hour': return '小时'
      case 'meter': return '米'
      case 'kilometer': return '千米'
      default: return '次'
    }
  })()

  const formatByUnit = (value: number): string => {
    if (settings.unit === 'second' || settings.unit === 'minute' || settings.unit === 'hour') {
      let totalMinutes = 0
      if (settings.unit === 'second') totalMinutes = Math.floor(value / 60)
      if (settings.unit === 'minute') totalMinutes = value
      if (settings.unit === 'hour') totalMinutes = value * 60

      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      if (hours <= 0) return `${minutes}分钟`
      if (minutes === 0) return `${hours}小时`
      return `${hours}小时${minutes}分钟`
    }
    return `${numberWithCommas(value)} ${unitLabel}`
  }

  return (
    <div className="flex w-full items-center">
      <Link className="mr-4 flex shrink-0 items-center" href={href} target="_blank">
        <span className="flex size-20 items-center">
          <Avatar />
        </span>
      </Link>

      <div className="flex basis-1/2 flex-col gap-1">
        <div>
          {!!graphData.name && (
            <span className="text-xl font-semibold" translate="no">
              {graphData.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-y-1 text-sm">
          <span className="flex items-center" translate="no">
            <AtSignIcon className="mr-px size-[13px]" />
            {graphData.login}
          </span>

          <DotIcon className="size-5" />

          <span className="flex items-center gap-1 whitespace-nowrap">
            <UserIcon className="size-4" />
            <span>{graphData.followers.totalCount}</span>
            <span className="opacity-70">followers</span>
          </span>

          <DotIcon className="size-5" />

          <span className="flex items-center gap-1 whitespace-nowrap">
            <span>{graphData.following.totalCount}</span>
            <span className="opacity-70">following</span>
          </span>
        </div>

        {!!graphData.bio && (
          <div
            className={`line-clamp-3 text-sm opacity-70 ${
              settings.size === GraphSize.Small ? 'max-w-[300px]' : 'max-w-[400px]'
            }`}
          >
            {graphData.bio}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 text-xs">
        <Link className="pb-2" href={href} target="_blank">
          <span className="inline-block size-9">
            {source === 'notion' ? <NotionIcon /> : <GitHubIcon />}
          </span>
        </Link>

        <span className="opacity-70">
          {typeof totalContributions === 'number' ? formatByUnit(totalContributions) : '-'}
        </span>

        <span className="opacity-70">
          {typeof totalYears === 'number'
            ? totalYears === 1
              ? `In ${lastYear ?? '-'}`
              : `${totalYears} Years`
            : '-'}
        </span>
      </div>
    </div>
  )
}
