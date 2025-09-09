import * as Popover from '@radix-ui/react-popover'
import { XIcon } from 'lucide-react'

export interface PopoverProps extends Popover.PopoverProps {
  title?: React.ReactNode
  content?: React.ReactNode
  popoverContentId?: string
}

export function RadixPopover(props: React.PropsWithChildren<PopoverProps>) {
  const { children, title, content, popoverContentId, ...popoverProps } = props

  return (
    <div className="relative inline-block text-left">
      <Popover.Root {...popoverProps}>
        <Popover.Trigger asChild>{children}</Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="center"
            className="z-50 rounded-lg bg-white p-4 shadow-overlay"
            id={popoverContentId}
            sideOffset={4}
          >
            <Popover.Arrow className="fill-current text-white" />

            {title ? (
              <h3 className="mb-2 min-h-[24px] font-medium text-main-500">{title}</h3>
            ) : null}

            {content}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
