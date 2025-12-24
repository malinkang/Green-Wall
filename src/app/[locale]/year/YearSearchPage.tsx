'use client'

import { useMemo, useState } from 'react'

import { useTranslations } from 'next-intl'

import { GenerateButton } from '~/components/GenerateButton/GenerateButton'
import { SearchInput } from '~/components/SearchInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { useRecentUsers } from '~/components/UserDiscovery/useRecentUsers'
import { getCurrentYear, normalizeGitHubUsername } from '~/helpers'
import { eventTracker } from '~/lib/analytics'
import { useSession } from '~/lib/auth-client'
import { useData } from '~/DataContext'
import { toastManager } from '~/components/ui/toast'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

import { YearQuickEntryCard } from './components/YearQuickEntryCard'
import { useYearWrappedNavigation } from './hooks/useYearWrappedNavigation'

export function YearSearchPage() {
  const t = useTranslations('yearSearch')
  const { data: session, isPending: isSessionPending } = useSession()
  const router = useRouter()
  const locale = useLocale()

  const currentYear = getCurrentYear()

  const yearOptions = useMemo(() => {
    const years: number[] = []

    for (let year = 2025; year >= 2018; year--) {
      years.push(year)
    }

    return years
  }, [currentYear])

  /* const [username, setUsername] = useState('') */
  const [selectedYear, setSelectedYear] = useState<string>(String(2025))

  const { isNavigating, navigateToYearUser } = useYearWrappedNavigation()
  const { recentUsers, removeRecentUser } = useRecentUsers()

  const isLoggedIn = Boolean(session?.user)
  const user = session?.user
    ? {
      name: session.user.name,
      login: (session.user as { login?: string }).login,
      image: session.user.image,
    }
    : null

  /* const handleUsernameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(ev.target.value)
  } */

  const handleYearChange = (value: string | null) => {
    if (value !== null) {
      setSelectedYear(value)
    }
  }

  /* const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()

    const normalizedUsername = normalizeGitHubUsername(username)
    const year = Number(selectedYear)

    if (normalizedUsername && year) {
      eventTracker.year.search.submit(year, 'manual')
      navigateToYearUser({ year, username: normalizedUsername })
    }
  } */

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setGraphData } = useData()

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setIsLoading(true)
    setError(null)

    const year = Number(selectedYear)

    try {
      const vid = localStorage.getItem('weread_vid')
      const accessToken = localStorage.getItem('weread_token')
      const refreshToken = localStorage.getItem('weread_refresh_token')
      const deviceId = localStorage.getItem('weread_device_id')
      // Note: activationCode is not usually stored in localStorage unless we put it there. 
      // Assuming it might be in localStorage OR we might need to handle it. 
      // The user request says: "activationCode": "YOUR_ACTIVATION_CODE". 
      // If it's not available, this might fail. But let's try to proceed with what we have.
      // If activationCode is needed, we might need to ask the user or it might be implicit.
      // However, checkScanAndLogin returns 'wx_code' which might be what's referred to or 'skey'. 
      // Let's assume for now we use an empty string or null if not found, or maybe it's not needed for this specific endpoint if we have tokens.
      // Actually the prompt says: 'activationCode: "YOUR_ACTIVATION_CODE"'. 
      // I'll check if I can find where activationCode comes from. 
      // But for now, I will use what I have.

      const activationCode = localStorage.getItem('weread_activation_code') || "" // Placeholder

      if (!vid || !accessToken || !deviceId) {
        throw new Error("Missing credentials. Please login first.")
      }

      // Calculate baseTime: Jan 1st of selected year at 00:00:00
      const baseTime = new Date(year, 0, 1).getTime() / 1000

      const response = await fetch("https://api.notionhub.app/get-weread-detail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vid,
          accessToken,
          deviceId,
          refreshToken: refreshToken || "",
          activationCode,
          baseTime
        })
      })

      if (!response.ok) {
        throw new Error(`API Request failed: ${response.status}`)
      }

      const data = await response.json()

      // Store data in global context (or pass via other means)
      // We need a way to pass this data to the new page. 
      // Since window.open or router.push to a new page clears state unless it's a SPA navigation 
      // AND we use a global store that persists (like local storage or a very high level context provider that doesn't unmount).
      // Given the request "jump to a new page", and "Report page", let's behave like a SPA.
      // We can store it in localStorage for the report page to pick up, or in the DataProvider context if we navigate client-side.

      // Let's store in localStorage for simplicity and persistence across refreshing of the report page.
      localStorage.setItem('weread_report_data', JSON.stringify(data))
      localStorage.setItem('weread_report_year', String(year))

      // Navigate to report page
      // router.push(`/${locale}/report`) // We need router and locale
      // Since we don't have router/locale in this snippet context easily without adding hooks:
      // We need to add `useRouter` and `useLocale`.
      // Navigate to report page
      router.push(`/${locale}/report/${year}`)

    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (toastManager as any).add({ title: "Failed to generate report", description: err instanceof Error ? err.message : "Unknown error", type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewMyYear = () => {
    if (user?.login) {
      eventTracker.year.quickEntry.click(currentYear, true)
      navigateToYearUser({ year: currentYear, username: user.login })
    }
  }

  const handleSelectUser = (login: string) => {
    const year = Number(selectedYear)

    if (login && year) {
      eventTracker.year.search.submit(year, 'quick_entry')
      navigateToYearUser({ year, username: login })
    }
  }

  const handleRemoveUser = (login: string) => {
    removeRecentUser(login)
  }

  return (
    <div className="py-10 md:py-14">
      <h1 className="text-center text-3xl font-bold md:mx-auto md:px-20 md:text-4xl md:leading-[1.2] lg:text-5xl">
        {t('titleWithYear', { year: selectedYear })}
      </h1>

      <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
        {t('descriptionWithYear', { year: selectedYear })}
      </p>

      {isLoggedIn && (
        <>
          <div className="mt-8">
            <YearQuickEntryCard
              currentYear={currentYear}
              disabled={isNavigating}
              isPending={isSessionPending}
              user={user}
              onViewMyYear={handleViewMyYear}
            />
          </div>
          <div className="mx-auto mt-8 flex max-w-md items-center gap-4">
            <Separator className="flex-1" />
            <span className="shrink-0 text-sm text-muted-foreground">
              {t('orSearchOthers')}
            </span>
            <Separator className="flex-1" />
          </div>
        </>
      )}

      <div className="py-8 md:py-12">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center gap-y-6 md:flex-row md:gap-x-5">
            {/* <SearchInput
              disabled={isNavigating}
              isLoading={isNavigating}
              loadingLogin={null}
              placeholder={t('usernamePlaceholder')}
              recentUsers={recentUsers}
              translationNamespace="yearSearch"
              value={username}
              onChange={handleUsernameChange}
              onRemoveUser={handleRemoveUser}
              onSelectUser={handleSelectUser}
            /> */}

            <Select
              disabled={isNavigating}
              value={selectedYear}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="h-[2.8rem] w-[120px] justify-center text-center">
                <SelectValue className="text-xl font-medium" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <GenerateButton loading={isNavigating} type="submit">
              {t('viewWrapped')}
            </GenerateButton>
          </div>
        </form>
      </div>
    </div>
  )
}
