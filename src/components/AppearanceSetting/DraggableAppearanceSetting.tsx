import { useState } from 'react'

import { motion, useDragControls } from 'framer-motion'
import { XIcon } from 'lucide-react'

export function DraggableAppearanceSetting(
  props: React.PropsWithChildren<{
    initialPosition: { x: number, y: number }
    onClose?: () => void
    /** If true, pin the panel to the left side and disable dragging. */
    fixedLeft?: boolean
  }>,
) {
  const { children, initialPosition, onClose, fixedLeft } = props

  const dragControls = useDragControls()

  const [pressing, setPressing] = useState(false)

  return (
    <motion.div
      drag={!fixedLeft}
      animate={pressing ? 'scale' : undefined}
      className={
        `fixed z-50 inline-block overflow-hidden rounded-lg bg-white shadow-overlay `
        + (fixedLeft ? 'left-4 top-1/2 -translate-y-1/2' : 'left-0 top-0')
      }
      dragConstraints={{ current: document.body }}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 1000, bounceDamping: 40 }}
      style={{
        translate: fixedLeft ? undefined : `${initialPosition.x}px ${initialPosition.y}px`,
      }}
      variants={{
        scale: { scale: 0.97 },
      }}
    >
      <motion.div
        className="flex min-h-10 select-none items-center bg-accent-50 px-3 font-medium text-accent-500"
        initial={{ cursor: 'grab' }}
        whileTap={{ cursor: 'grabbing' }}
        onPointerDown={(event) => {
          if (!fixedLeft) {
            dragControls.start(event, { snapToCursor: false })
            setPressing(true)
          }
        }}
        onPointerUp={() => {
          setPressing(false)
        }}
      >
        Appearance
        <button
          aria-label="Close"
          className="ml-auto hidden md:block"
          title="Close"
          onClick={() => {
            onClose?.()
          }}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
        >
          <span className="inline-flex items-center justify-center rounded p-[0.3rem] text-main-500 transition-colors duration-200 hover:bg-red-100 hover:text-red-500">
            <XIcon className="size-4" />
          </span>
        </button>
      </motion.div>

      <div className="p-5">{children}</div>
    </motion.div>
  )
}
