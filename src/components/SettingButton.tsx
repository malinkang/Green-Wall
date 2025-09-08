import * as Popover from '@radix-ui/react-popover'
import { PictureInPicture2Icon, Settings2Icon } from 'lucide-react'

import { type PopoverProps, RadixPopover } from './ui-kit/RadixPopover'

interface SettingButtonProps
  extends Omit<React.ComponentProps<'button'>, 'content'>,
  Pick<PopoverProps, 'content' | 'popoverContentId'> {
  onPopOut?: () => void
}

export function SettingButton(props: SettingButtonProps) {
  const { content, popoverContentId, onPopOut, ...buttonProps } = props

  return (
    <RadixPopover
      content={content}
      popoverContentId={popoverContentId}
      title={(
        <div className="flex">
          <span>设置</span>

          <Popover.Close
            className="ml-auto hidden md:block"
            title="弹出"
            onClick={() => {
              onPopOut?.()
            }}
          >
            <span className="inline-flex items-center justify-center rounded p-[0.3rem] transition-colors duration-200 hover:bg-main-100/80">
              <PictureInPicture2Icon className="size-4 text-main-500" />
            </span>
          </Popover.Close>
        </div>
      )}
    >
      <button className="simple-button" {...buttonProps}>
        <Settings2Icon className="size-[18px]" />
        <span>设置</span>
      </button>
    </RadixPopover>
  )
}
