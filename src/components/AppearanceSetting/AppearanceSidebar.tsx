import React from 'react'
import { XIcon } from 'lucide-react'

export function AppearanceSidebar(props: React.PropsWithChildren<{
  open: boolean
  width?: number
  title?: string
  onClose?: () => void
}>) {
  const { children, open, width = 320, title = '设置', onClose } = props

  return (
    <aside
      aria-hidden={!open}
      className="fixed left-0 top-0 z-40 h-svh overflow-y-auto border-r border-[color-mix(in_srgb,var(--theme-border,_#d0d7de)_50%,transparent)] bg-white shadow-overlay transition-transform"
      style={{ width, transform: open ? 'translateX(0)' : `translateX(-${width + 12}px)` }}
    >
      {/* Header bar retained, but hide title text and close button per TODO */}
      <div className="sticky top-0 flex items-center gap-2 border-b bg-accent-50 px-3 py-2 text-accent-500">
        <span className="font-medium invisible">{title}</span>
        <span className="ml-auto hidden md:inline-flex" aria-hidden="true" />
      </div>
      <div className="p-4">
        {children}
      </div>
    </aside>
  )
}
