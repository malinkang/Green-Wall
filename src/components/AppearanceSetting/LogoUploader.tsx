import { useRef, useState } from 'react'

import { useData } from '~/DataContext'

export function LogoUploader() {
  const { settings, dispatchSettings } = useData()
  const [preview, setPreview] = useState<string | undefined>(settings.logoUrl)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : undefined
      setPreview(url)
      dispatchSettings({ type: 'logoUrl', payload: url })
    }
    reader.readAsDataURL(file)
  }

  return (
    <fieldset className="flex items-center gap-2">
      <label className="shrink-0 text-sm opacity-70">Logo</label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          accept="image/*"
          className="hidden"
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
        <button
          className="inline-flex items-center rounded bg-main-100 px-2 py-1 text-sm text-main-600 hover:bg-main-200"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          选择图片
        </button>
        {preview && (
          <>
            <img alt="logo" className="h-6 w-6 rounded border border-[var(--theme-border)] object-contain" src={preview} />
            <button
              className="inline-flex items-center rounded bg-red-100 px-2 py-1 text-sm text-red-600 hover:bg-red-200"
              type="button"
              onClick={() => {
                setPreview(undefined)
                dispatchSettings({ type: 'logoUrl', payload: undefined })
              }}
            >
              移除
            </button>
          </>
        )}
      </div>
    </fieldset>
  )
}

