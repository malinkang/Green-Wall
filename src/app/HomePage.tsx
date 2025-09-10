'use client'

import { useCallback, useId, useRef, useState } from 'react'

import { toBlob, toPng } from 'html-to-image'
import { DotIcon, FileCheck2Icon, ImageIcon, ImagesIcon } from 'lucide-react'

import { AppearanceSetting } from '~/components/AppearanceSetting'
import { AppearanceSidebar } from '~/components/AppearanceSetting/AppearanceSidebar'
import { ContributionsGraph } from '~/components/ContributionsGraph'
import { ErrorMessage } from '~/components/ErrorMessage'
import GenerateButton from '~/components/GenerateButton'
import Loading from '~/components/Loading'
import { SearchInput } from '~/components/SearchInput'
// import { SettingButton } from '~/components/SettingButton'
import { ShareButton } from '~/components/ShareButton'
import { useData } from '~/DataContext'
import { trackEvent } from '~/helpers'
import { useGraphRequest } from '~/hooks/useGraphRequest'
import type { GitHubUsername } from '~/types'

function Divider() {
  return (
    <div className="my-4 flex items-center justify-center gap-x-2 text-main-200">
      <span className="h-px w-1/3 bg-gradient-to-l from-current to-transparent" />
      <DotIcon className="size-4 text-main-300" />
      <span className="h-px w-1/3 bg-gradient-to-r from-current to-transparent" />
    </div>
  )
}

export function HomePage() {
  const canUseClipboardItem = typeof ClipboardItem !== 'undefined'

  const graphRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<HTMLDivElement | null>(null)

  const { graphData, setGraphData, dispatchSettings } = useData()
  const [searchName, setSearchName] = useState<GitHubUsername>('')

  // Restore sidebar settings (always open; hide title/close button in component)
  const [appearanceOpen] = useState(true)

  const [downloading, setDownloading] = useState(false)

  const [doingCopy, setDoingCopy] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const reset = () => {
    setGraphData(undefined)
    dispatchSettings({ type: 'reset' })
  }

  const handleError = () => {
    reset()
  }

  const { run, loading, error } = useGraphRequest({ onError: handleError })

  const handleSubmit = async () => {
    const trimmedName = searchName.trim()

    if (trimmedName && !loading) {
      let username = trimmedName

      if (trimmedName.includes('/')) {
        // Extract username from GitHub URL if applicable.
        const githubUrlPattern = /^https:\/\/github\.com\/([^/?#]+)(?:[/?#]|$)/
        const match = githubUrlPattern.exec(trimmedName)

        if (match) {
          username = match[1]
        }
        else {
          reset()
          setSearchName('')

          return
        }
      }

      reset()
      trackEvent('Click Generate')

      const data = await run({ username })

      if (data) {
        setSearchName(data.login)
      }

      setGraphData(data)
    }
  }

  const handleDownload = async () => {
    if (graphRef.current && graphData && !downloading) {
      try {
        setDownloading(true)
        trackEvent('Click Download')

        const dataURL = await toPng(graphRef.current, { cacheBust: true, useCORS: true })
        const trigger = document.createElement('a')
        trigger.href = dataURL
        trigger.download = `${graphData.login}_contributions`
        trigger.click()
      }
      catch (err) {
        if (err instanceof Error) {
          trackEvent('Error: Download Image', { msg: err.message })
        }
      }
      finally {
        setTimeout(() => {
          setDownloading(false)
        }, 2000)
      }
    }
  }

  const handleCopyImage = async () => {
    if (graphRef.current && graphData && canUseClipboardItem && !doingCopy) {
      try {
        setDoingCopy(true)
        trackEvent('Click Copy Image')

        const item = new ClipboardItem({
          'image/png': (async () => {
            /**
             * To be able to use `ClipboardItem` in safari, need to pass promise directly into it.
             * @see https://stackoverflow.com/questions/66312944/javascript-clipboard-api-write-does-not-work-in-safari
             */
            if (!graphRef.current) {
              throw new Error()
            }

            const blobData = await toBlob(graphRef.current, { cacheBust: true, useCORS: true })

            if (!blobData) {
              throw new Error()
            }

            return blobData
          })(),
        })

        await navigator.clipboard.write([item])

        setCopySuccess(true)

        setTimeout(() => {
          setCopySuccess(false)
        }, 2000)
      }
      catch (err) {
        if (err instanceof Error) {
          trackEvent('Error: Copy Image', { msg: err.message })
        }
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

        if (offsetTop > 0) {
          // When the graph appears, automatically scrolls to the position where the graph appears to avoid obscuring it.
          document.body.scrollTo({ left: 0, top: offsetTop, behavior: 'smooth' })
        }

        // Previously auto-pop-out settings; not needed for sidebar
      }
    },
    [graphWrapperId],
  )

  const SIDEBAR_WIDTH = 320
  return (
    <div className="relative">
      <AppearanceSidebar open={appearanceOpen} width={SIDEBAR_WIDTH}>
        <AppearanceSetting />
      </AppearanceSidebar>

      <div className="py-10 md:py-14" style={{ marginLeft: appearanceOpen ? SIDEBAR_WIDTH + 16 : 0 }}>
      <h1 className="text-center text-3xl font-bold md:mx-auto md:px-20 md:text-4xl md:leading-[1.2] lg:text-6xl">
        Review the contributions you have made on GitHub over the years.
      </h1>

      <div className="py-12 md:py-16">
        <form
          onSubmit={(ev) => {
            ev.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="flex flex-col items-center justify-center gap-y-6 md:flex-row md:gap-x-5">
            <SearchInput
              disabled={loading}
              value={searchName}
              onChange={(ev) => {
                setSearchName(ev.target.value)
              }}
            />
            <GenerateButton loading={loading} type="submit" />
          </div>
          <div className="mt-3 text-center text-sm opacity-70">
            Or generate from Notion database? <a className="underline" href="/notion">Try Notion mode</a>
          </div>
        </form>
      </div>

      {error
        ? (
            <ErrorMessage errorType={error.errorType} text={error.message} />
          )
        : (
            <Loading active={loading}>
              {graphData && (
                <>
                  <div
                    ref={actionRefCallback}
                    className="flex flex-row-reverse flex-wrap items-center justify-center gap-x-6 gap-y-4 py-5"
                  >
                    <div className="flex gap-x-3">
                      <button
                        className="inline-flex h-full items-center rounded-md bg-main-100 px-4 py-2 text-sm font-medium text-main-500 hover:bg-main-200 disabled:pointer-events-none motion-safe:transition-colors motion-safe:duration-300 md:text-base"
                        disabled={downloading}
                        onClick={() => {
                          void handleDownload()
                        }}
                      >
                        <ImageIcon className="mr-2 size-4 shrink-0 md:size-5" />
                        <span>保存为图片</span>
                      </button>

                      {canUseClipboardItem && (
                        <button
                          className={`
                      inline-flex h-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none md:text-base
                      ${
                        copySuccess
                          ? 'bg-accent-100 text-accent-500'
                          : 'bg-main-100 text-main-500 duration-300 hover:bg-main-200 motion-safe:transition-colors'
                        }
                      `}
                          disabled={doingCopy}
                          onClick={() => {
                            void handleCopyImage()
                          }}
                        >
                          <span className="mr-2">
                            {copySuccess
                              ? (
                                  <FileCheck2Icon className="size-4 shrink-0 md:size-5" />
                                )
                              : (
                                  <ImagesIcon className="size-4 shrink-0 md:size-5" />
                                )}
                          </span>
                          <span>{copySuccess ? '已复制' : '复制'} 图片</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 md:justify-center">
                      <ShareButton />
                      {/* Appearance sidebar shown by default; removed toggle button */}
                    </div>
                  </div>

                  <Divider />

                  <div className="flex overflow-x-auto md:justify-center">
                    <ContributionsGraph ref={graphRef} wrapperId={graphWrapperId} />
                  </div>
                </>
              )}
            </Loading>
          )}
      </div>
    </div>
  )
}
