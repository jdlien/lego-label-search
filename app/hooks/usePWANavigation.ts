'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePWA } from '../components/PWAHandler'

type UsePWANavigationOptions = {
  /** Callback to run before navigation (e.g., close a modal) */
  onBeforeNavigate?: () => void
}

type UsePWANavigationReturn = {
  /** Navigate to a category page */
  navigateToCategory: (categoryId: string) => void
  /** Navigate to search for a part */
  navigateToSearch: (partId: string) => void
  /** Navigate to a custom URL */
  navigateTo: (url: string) => void
  /** Whether the app is running as a PWA */
  isPWA: boolean
}

/**
 * Hook for PWA-aware navigation.
 *
 * In PWA mode (iOS standalone), uses window.location.href for more reliable navigation.
 * In regular browser mode, uses Next.js router.push for smoother transitions.
 *
 * The delays (150ms for PWA, 100ms for browser) ensure modal close animations complete
 * before navigation, which is especially important on iOS PWA where navigation can
 * interrupt ongoing animations.
 *
 * @param options - Optional configuration
 */
export function usePWANavigation(options: UsePWANavigationOptions = {}): UsePWANavigationReturn {
  const router = useRouter()
  const isPWA = usePWA()
  const { onBeforeNavigate } = options

  /**
   * Internal navigation handler that respects PWA mode.
   */
  const navigate = useCallback(
    (url: string) => {
      // Call the before-navigate callback (e.g., close modal)
      onBeforeNavigate?.()

      if (isPWA) {
        // In PWA mode, use window.location.href for more reliable navigation on iOS
        setTimeout(() => {
          window.location.href = url
        }, 150) // Slightly longer delay for PWA mode
      } else {
        // Standard navigation for regular browser mode
        setTimeout(() => {
          router.push(url)
        }, 100)
      }
    },
    [isPWA, router, onBeforeNavigate]
  )

  /**
   * Navigate to a category page.
   * This clears any existing search query.
   */
  const navigateToCategory = useCallback(
    (categoryId: string) => {
      navigate(`/?category=${categoryId}`)
    },
    [navigate]
  )

  /**
   * Navigate to search for a specific part.
   */
  const navigateToSearch = useCallback(
    (partId: string) => {
      const params = new URLSearchParams()
      params.append('q', partId)
      navigate(`/?${params.toString()}`)
    },
    [navigate]
  )

  /**
   * Navigate to a custom URL.
   */
  const navigateTo = useCallback(
    (url: string) => {
      navigate(url)
    },
    [navigate]
  )

  return {
    navigateToCategory,
    navigateToSearch,
    navigateTo,
    isPWA,
  }
}

export default usePWANavigation
