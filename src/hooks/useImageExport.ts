'use client'

import { type RefObject, useState } from 'react'

import { toBlob, toPng } from 'html-to-image'

import { eventTracker } from '~/lib/analytics'
import type { GraphSettings } from '~/types'

interface UseImageExportOptions {
  filename?: string
}

export function useImageExport(
  graphRef: RefObject<HTMLDivElement | null>,
  username: string,
  settings: GraphSettings,
  options?: UseImageExportOptions & { context?: 'home' | 'year_report' },
) {
  const context = options?.context ?? 'home'
  const canUseClipboardItem = typeof ClipboardItem !== 'undefined'

  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleDownload = async () => {
    if (graphRef.current && username && !isDownloading) {
      eventTracker.image.download.click(context, settings.size)

      try {
        setIsDownloading(true)

        const dataURL = await toPng(graphRef.current, {
          cacheBust: true,
          skipOnError: true,
          style: {
            backgroundColor: settings.theme?.toLowerCase() === 'greenwall' ? '#060606' : undefined,
          },
        })
        const trigger = document.createElement('a')
        trigger.href = dataURL
        trigger.download = options?.filename ?? `${username}_contributions`
        trigger.click()

        eventTracker.image.download.success(
          settings.size,
          settings.theme ?? 'unknown',
          settings.daysLabel ?? false,
          settings.showAttribution ?? false,
          context,
        )
      }
      catch (err) {
        console.error('Download failed:', err)
        if (err instanceof Error) {
          eventTracker.image.download.error(err.message, context)
        }
      }
      finally {
        setTimeout(() => {
          setIsDownloading(false)
        }, 2000)
      }
    }
  }

  const handleCopyImage = async () => {
    if (graphRef.current && username && canUseClipboardItem && !isCopying) {
      eventTracker.image.copy.click(context, settings.size)

      try {
        setIsCopying(true)

        const item = new ClipboardItem({
          'image/png': (async () => {
            // To be able to use `ClipboardItem` in safari, need to pass promise directly into it.
            // @see https://stackoverflow.com/questions/66312944/javascript-clipboard-api-write-does-not-work-in-safari
            if (!graphRef.current) {
              throw new Error()
            }

            const blobData = await toBlob(graphRef.current, {
              cacheBust: true,
              skipOnError: true,
              style: {
                backgroundColor: settings.theme?.toLowerCase() === 'greenwall' ? '#060606' : undefined,
              },
            })

            if (!blobData) {
              throw new Error()
            }

            return blobData
          })(),
        })

        await navigator.clipboard.write([item])

        eventTracker.image.copy.success(
          settings.size,
          settings.theme ?? 'unknown',
          settings.daysLabel ?? false,
          context,
        )

        setCopySuccess(true)

        setTimeout(() => {
          setCopySuccess(false)
        }, 2000)
      }
      catch (err) {
        console.error('Copy failed:', err)

        if (err instanceof Error) {
          eventTracker.image.copy.error(err.message, context)
        }
      }
      finally {
        setIsCopying(false)
      }
    }
  }

  return {
    canUseClipboardItem,
    isDownloading,
    isCopying,
    copySuccess,
    handleDownload,
    handleCopyImage,
  }
}
