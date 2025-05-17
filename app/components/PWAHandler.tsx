import React, { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'

// Hook to detect PWA mode (standalone display)
export function usePWA(): boolean {
  const [isPWA, setIsPWA] = useState<boolean>(false)

  useEffect(() => {
    // This effect runs only on the client-side
    const checkPWA = () => window.matchMedia('(display-mode: standalone)').matches

    setIsPWA(checkPWA())

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e: MediaQueryListEvent) => setIsPWA(e.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isPWA
}

// Component for the top safe area bar (frosted glass effect)
export const PWATopBar = () => {
  const isPWA = usePWA()

  if (!isPWA) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-blue-600 dark:bg-gray-800 backdrop-blur-md z-[1500] pointer-events-none"
      style={{ height: 'env(safe-area-inset-top)' }}
    />
  )
}

// Component for the bottom navigation bar (frosted glass effect)
export const PWABottomNav = () => {
  const isPWA = usePWA()
  const router = useRouter()

  if (!isPWA) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white/75 dark:bg-gray-800/75 backdrop-blur-md z-[2000] flex items-center justify-between"
      style={{
        height: 'calc(env(safe-area-inset-bottom) + 30px)',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        paddingBottom: 'calc(env(safe-area-inset-bottom) - 24px)',
      }}
    >
      <button
        aria-label="Back"
        onClick={() => router.back()}
        className="p-3 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <IoChevronBackOutline size="28px" />
      </button>
      <button
        aria-label="Forward"
        onClick={() => router.forward()}
        className="p-3 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <IoChevronForwardOutline size="28px" />
      </button>
    </div>
  )
}

// Wrapper component to adjust main content padding for PWA fixed bars
interface PWAViewportAdjusterProps {
  children: ReactNode
  className?: string
}

export const PWAViewportAdjuster = ({ children, className = '' }: PWAViewportAdjusterProps) => {
  const isPWA = usePWA()

  if (!isPWA) {
    // If not in PWA mode, render children directly without adjustment
    return <>{children}</>
  }

  return (
    <div
      className={className}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 30px)',
        width: '100%',
      }}
    >
      {children}
    </div>
  )
}
