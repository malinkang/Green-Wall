'use client'

import { BookCopyIcon } from 'lucide-react'

interface BookItem {
    albumInfo?: {
        albumInfo?: {
            cover?: string
            name?: string
        }
    }
    bookInfo?: {
        cover?: string
        title?: string
    }
}

export interface BookCoverWallProps {
    readLongest: BookItem[] | undefined
    isLoading: boolean
}

export function BookCoverWall({ readLongest, isLoading }: BookCoverWallProps) {
    if (isLoading) {
        return (
            <div
                className="rounded-lg border p-4 shadow-sm"
                style={{ borderColor: 'var(--theme-border)' }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <BookCopyIcon className="size-5 text-amber-500" />
                    <span className="font-medium">阅读最多的书</span>
                </div>
                <div className="h-32 animate-pulse bg-foreground/5 rounded-md" />
            </div>
        )
    }

    if (!readLongest || readLongest.length === 0) {
        return null
    }

    // Extract covers from both albumInfo and bookInfo
    const covers: { url: string; title: string }[] = []
    readLongest.forEach(item => {
        if (item.albumInfo?.albumInfo?.cover) {
            covers.push({
                url: item.albumInfo.albumInfo.cover,
                title: item.albumInfo.albumInfo.name || ''
            })
        } else if (item.bookInfo?.cover) {
            covers.push({
                url: item.bookInfo.cover,
                title: item.bookInfo.title || ''
            })
        }
    })

    if (covers.length === 0) {
        return null
    }

    return (
        <div
            className="rounded-lg border p-4 shadow-sm"
            style={{ borderColor: 'var(--theme-border)' }}
        >
            <div className="flex items-center gap-2 mb-3">
                <BookCopyIcon className="size-5 text-amber-500" />
                <span className="font-medium">阅读最多的书</span>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                {covers.map((cover, index) => (
                    <div
                        key={index}
                        className="relative w-16 h-24 rounded overflow-hidden shadow-md hover:scale-105 transition-transform"
                        title={cover.title}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={cover.url}
                            alt={cover.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
