import React from 'react'
import { XIcon } from 'lucide-react'

export function AppearanceSidebar(props: React.PropsWithChildren<{
  open: boolean
  width?: number
  title?: string
  onClose?: () => void
}>) {
  const { children, open, width = 320, title = 'Appearance', onClose } = props

  return (
    <aside
      aria-hidden={!open}
      className="fixed left-0 top-0 z-40 h-svh overflow-y-auto border-r border-[color-mix(in_srgb,var(--theme-border,_#d0d7de)_50%,transparent)] bg-white shadow-overlay transition-transform"
      style={{ width, transform: open ? 'translateX(0)' : `translateX(-${width + 12}px)` }}
    >
      <div className="sticky top-0 flex items-center gap-2 border-b bg-accent-50 px-3 py-2 text-accent-500">
        <span className="font-medium">{title}</span>
        <button
          aria-label="Close sidebar"
          className="ml-auto hidden md:inline-flex"
          onClick={() => onClose?.()}
        >
          <span className="inline-flex items-center justify-center rounded p-[0.3rem] transition-colors duration-200 hover:bg-main-100/80">
            <XIcon className="size-4" />
          </span>
        </button>
      </div>
      <div className="p-4">
        {children}
      </div>
    </aside>
  )
}

