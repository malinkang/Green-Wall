'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { toastManager } from '~/components/ui/toast'
import { WeReadUser, CheckScanLoginResult, fetchWeReadSummary } from '~/services/weread-auth'
import { transformWeReadDataToGraphData } from '~/services/weread-transformer'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { CalendarIcon, LogInIcon, LogOutIcon } from 'lucide-react'
import { useData } from '~/DataContext'

import { LoginBenefitsPopoverContent } from '~/components/LoginBenefitsPopoverContent'
import { WeReadLoginModal } from '~/components/WeReadLoginModal'
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '~/components/ui/menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Spinner } from '~/components/ui/spinner'
import { getCurrentYear } from '~/helpers'
import { useCurrentPathWithSearch } from '~/hooks/useCurrentPathWithSearch'
import { usePathname } from '~/i18n/navigation'
import { eventTracker } from '~/lib/analytics'
import { authClient, useSession } from '~/lib/auth-client'

interface ExtendedUser {
  name?: string | null
  email?: string | null
  image?: string | null
  login?: string
}

export function AuthStatusButton() {
  const { data: session, isPending } = useSession()
  const t = useTranslations('auth')
  const locale = useLocale()
  const currentYear = getCurrentYear()
  const callbackURL = useCurrentPathWithSearch()
  const pathname = usePathname()

  /* Existing session logic can remain or be conditionally rendered */
  // We'll prioritize WeRead login if active
  const [weReadUser, setWeReadUser] = useState<WeReadUser | null>(null)

  const { setGraphData, setIsLoading } = useData()

  // Function to load WeRead data
  const loadWeReadData = async (user: WeReadUser, accessToken: string, vid: number, deviceId: string) => {
    try {
      console.log("Loading WeRead data...")
      setIsLoading(true)
      const storedRefreshToken = localStorage.getItem('weread_refresh_token') || ""

      const summary = await fetchWeReadSummary({
        vid,
        accessToken,
        refreshToken: storedRefreshToken,
        deviceId: deviceId || "web_device"
      })

      console.log("WeRead Summary:", summary)

      if (summary) {
        // Cache summary data for report page to use for heatmap
        localStorage.setItem('weread_summary', JSON.stringify(summary))

        const graphData = transformWeReadDataToGraphData(summary, user.name || "WeRead User", user.avatar || "")
        setGraphData(graphData)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ; (toastManager as any).add({ title: "WeRead Data Loaded", type: 'success' })
      }

    } catch (e) {
      console.error("Failed to load WeRead data", e)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (toastManager as any).add({ title: "Failed to load reading data", type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Skip auto-load on Report Page to avoid overwriting specific report data
    if (pathname.includes('/report')) {
      return
    }

    // Load from local storage
    const stored = localStorage.getItem('weread_user')
    const storedToken = localStorage.getItem('weread_token')
    const storedVid = localStorage.getItem('weread_vid')
    const storedDeviceId = localStorage.getItem('weread_device_id') // eslint-disable-next-line react-hooks/exhaustive-deps


    if (stored && storedToken && storedVid) {
      try {
        const user = JSON.parse(stored)
        setWeReadUser(user)
        // Auto load data on mount if logged in
        loadWeReadData(user, storedToken, Number(storedVid), storedDeviceId || "web_device")
      } catch (e) {
        console.error("Failed to parse stored user", e)
      }
    }
  }, [])

  const handleLoginSuccess = (result: CheckScanLoginResult) => {
    if (result.user) {
      setWeReadUser(result.user)
      localStorage.setItem('weread_user', JSON.stringify(result.user))
      // Also store tokens if needed for creating heatmaps later?
      if (result.accessToken) localStorage.setItem('weread_token', result.accessToken);
      if (result.vid) localStorage.setItem('weread_vid', String(result.vid));
      if (result.refreshToken) localStorage.setItem('weread_refresh_token', result.refreshToken); // Store refresh token
      if (result.generatedDeviceId) localStorage.setItem('weread_device_id', result.generatedDeviceId);

      // Assuming toastManager.add takes a single object argument based on linter feedback
      // and checking toast.tsx implying toast has a 'type' property.
      // We cast if necessary or just pass the object.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ; (toastManager as any).add({
        title: t('loginSuccess') || "Login Successful",
        type: 'success'
      })

      // Load data immediately
      if (result.accessToken && result.vid) {
        loadWeReadData(result.user, result.accessToken, result.vid, result.generatedDeviceId || "web_device")
      }
    }
  }

  const handleWeReadLogout = () => {
    setWeReadUser(null);
    setGraphData(undefined); // Clear graph data
    localStorage.removeItem('weread_user');
    localStorage.removeItem('weread_token');
    localStorage.removeItem('weread_vid');
    localStorage.removeItem('weread_refresh_token');
    localStorage.removeItem('weread_device_id');
    localStorage.removeItem('weread_summary'); // Clear summary cache
    localStorage.removeItem('weread_report_data'); // Clear report data
    localStorage.removeItem('weread_report_year'); // Clear report year
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ; (toastManager as any).add({
      title: t('logoutSuccess') || "Logged out",
      type: 'success'
    })
  }

  // If WeRead user is logged in, show that
  if (weReadUser) {
    return (
      <Menu>
        <MenuTrigger
          render={(props) => (
            <button
              type="button"
              {...props}
              className="flex items-center rounded-full p-1 bg-foreground/10 overflow-hidden"
            >
              <Avatar className="size-8">
                <AvatarImage src={weReadUser.avatar} alt={weReadUser.name} />
                <AvatarFallback>{weReadUser.name?.[0] || 'W'}</AvatarFallback>
              </Avatar>
            </button>
          )}
        />

        <MenuPopup className="min-w-32">
          <div className="px-1 text-sm">
            <div className="font-medium">{weReadUser.name}</div>
          </div>

          <MenuSeparator />

          <MenuItem onClick={handleWeReadLogout}>
            <LogOutIcon />
            {t('signOut')}
          </MenuItem>
        </MenuPopup>
      </Menu>
    )
  }

  if (isPending) {
    return (
      <Button disabled size="icon" variant="outline">
        <Spinner />
      </Button>
    )
  }

  if (session?.user) {
    const user = session.user as ExtendedUser
    const displayName = user.name ?? user.login ?? 'User'
    const avatarUrl = user.image ?? ''
    const initials = displayName.slice(0, 2).toUpperCase()

    const handleSignOut = () => {
      eventTracker.auth.signOut.click()
      void authClient.signOut()
    }

    const handleYearReview = () => {
      const username = user.login || user.name || ''
      const url = username ? `/year/${currentYear}/${username}` : '/year'

      eventTracker.auth.yearReview.open(currentYear, Boolean(user.login))
      window.open(url, '_blank')
    }

    return (
      <Menu>
        <MenuTrigger
          render={(props) => (
            <button
              type="button"
              {...props}
              className="flex items-center rounded-full p-1 bg-foreground/10 overflow-hidden"
            >
              <Avatar className="size-8">
                <AvatarImage alt={displayName} src={avatarUrl} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          )}
        />

        <MenuPopup className="min-w-32">
          <div className="px-1 text-sm">
            <div className="font-medium">{displayName}</div>
            {user.login && (
              <div className="text-muted-foreground">@{user.login}</div>
            )}
          </div>

          <MenuSeparator />

          <MenuItem onClick={handleYearReview}>
            <CalendarIcon />
            {t('yearReview', { year: currentYear })}
          </MenuItem>

          <MenuItem onClick={handleSignOut}>
            <LogOutIcon />
            {t('signOut')}
          </MenuItem>
        </MenuPopup>
      </Menu>
    )
  }

  const handleSignIn = () => {
    eventTracker.auth.signIn.click('header')
    void authClient.signIn.social({
      provider: 'github',
      callbackURL,
    })
  }

  // 未登录状态
  return (
    <div className="flex items-center gap-2">
      <Link href={`/${locale}/year`} prefetch={false}>
        <Button variant="ghost" size="icon">
          <CalendarIcon />
        </Button>
      </Link>
      <WeReadLoginModal onLoginSuccess={handleLoginSuccess}>
        <Button variant="outline">
          <LogInIcon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('signInWithWeRead')}</span>
        </Button>
      </WeReadLoginModal>
    </div>
  )
}
