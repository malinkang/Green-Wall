import React from 'react'
import { XIcon } from 'lucide-react'

export function AppearanceSidebar(props: React.PropsWithChildren<{
  open: boolean
  width?: number
  title?: string
  onClose?: () => void
  side?: 'left' | 'right'
}>) {
  const { children, open, width = 320, title = '设置', onClose, side = 'left' } = props
  const isRight = side === 'right'

  return (
    <aside
      aria-hidden={!open}
      className={`fixed top-0 z-40 h-svh overflow-y-auto bg-white shadow-overlay transition-transform ${
        isRight ? 'right-0 border-l' : 'left-0 border-r'
      } border-[color-mix(in_srgb,var(--theme-border,_#d0d7de)_50%,transparent)]`}
      style={{
        width,
        transform: open ? 'translateX(0)' : `translateX(${isRight ? width + 12 : -(width + 12)}px)`,
      }}
    >
      <div className="p-4">
        {children}
      </div>
    </aside>
  )
}
