import { useData } from '~/DataContext'

export function TitleSubtitleInputs() {
  const { settings, dispatchSettings } = useData()

  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex items-center gap-2">
        <label className="shrink-0 text-sm opacity-70">标题</label>
        <input
          className="inline-block h-[2.0rem] w-[16rem] rounded bg-main-100 px-2 text-sm text-main-700 outline-none transition-colors focus:bg-white"
          placeholder="自定义标题"
          value={settings.titleOverride ?? ''}
          onChange={(e) => dispatchSettings({ type: 'titleOverride', payload: e.target.value || undefined })}
        />
      </fieldset>

      <fieldset className="flex items-center gap-2">
        <label className="shrink-0 text-sm opacity-70">副标题</label>
        <input
          className="inline-block h-[2.0rem] w-[16rem] rounded bg-main-100 px-2 text-sm text-main-700 outline-none transition-colors focus:bg-white"
          placeholder="自定义副标题"
          value={settings.subtitleOverride ?? ''}
          onChange={(e) => dispatchSettings({ type: 'subtitleOverride', payload: e.target.value || undefined })}
        />
      </fieldset>
    </div>
  )
}

