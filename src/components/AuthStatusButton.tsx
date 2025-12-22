'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { toastManager } from '~/components/ui/toast'
import { WeReadUser, CheckScanLoginResult } from '~/services/weread-auth'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { CalendarIcon, LogInIcon, LogOutIcon } from 'lucide-react'

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

  /* Existing session logic can remain or be conditionally rendered */
  // We'll prioritize WeRead login if active
  const [weReadUser, setWeReadUser] = useState<WeReadUser | null>(null)

  useEffect(() => {
    // Load from local storage
    const stored = localStorage.getItem('weread_user')
    if (stored) {
      try {
        setWeReadUser(JSON.parse(stored))
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

      // Assuming toastManager.add takes a single object argument based on linter feedback
      // and checking toast.tsx implying toast has a 'type' property.
      // We cast if necessary or just pass the object.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (toastManager as any).add({
        title: t('loginSuccess') || "Login Successful",
        type: 'success'
      })
    }
  }

  const handleWeReadLogout = () => {
    setWeReadUser(null);
    localStorage.removeItem('weread_user');
    localStorage.removeItem('weread_token');
    localStorage.removeItem('weread_vid');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (toastManager as any).add({
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
