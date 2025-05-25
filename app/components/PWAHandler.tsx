'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'

// Hook to detect PWA mode (standalone display)
export function usePWA(): boolean {
  const [isPWA, setIsPWA] = useState<boolean>(false)

  useEffect(() => {
    // This effect runs only on the client-side
    const checkPWA = () => {
      // Check multiple conditions for PWA detection
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches
      const isNavigatorStandalone = (window.navigator as any)?.standalone === true

      const result = isStandalone || isFullscreen || isMinimalUI || isNavigatorStandalone

      // Debug logging
      console.log('PWA Detection:', {
        isStandalone,
        isFullscreen,
        isMinimalUI,
        isNavigatorStandalone,
        result,
        userAgent: navigator.userAgent,
        safeAreaTop: getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)'),
      })

      return result
    }

    setIsPWA(checkPWA())

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e: MediaQueryListEvent) => {
      console.log('Display mode changed:', e.matches)
      setIsPWA(checkPWA())
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isPWA
}

// Component for the top safe area bar (frosted glass effect)
export const PWATopBar = () => {
  const isPWA = usePWA()
  const [safeAreaHeight, setSafeAreaHeight] = useState<number>(0)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && isPWA) {
      // Try to get safe area from CSS env()
      const testDiv = document.createElement('div')
      testDiv.style.height = 'env(safe-area-inset-top, 0px)'
      testDiv.style.position = 'fixed'
      testDiv.style.top = '0'
      testDiv.style.visibility = 'hidden'
      document.body.appendChild(testDiv)

      const computedHeight = window.getComputedStyle(testDiv).height
      const heightValue = parseInt(computedHeight) || 0

      document.body.removeChild(testDiv)

      // Fallback detection for iOS devices
      let fallbackHeight = 0
      if (heightValue === 0 && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Common safe area heights for different iPhone models
        const screenHeight = window.screen.height
        const screenWidth = window.screen.width

        // iPhone X and newer models typically have safe areas
        if (screenHeight >= 812 || screenWidth >= 812) {
          fallbackHeight = 44 // Standard safe area height for iPhone X+
        }
      }

      const finalHeight = heightValue || fallbackHeight
      setSafeAreaHeight(finalHeight)

      setDebugInfo(
        `CSS: ${computedHeight}, Parsed: ${heightValue}px, Fallback: ${fallbackHeight}px, Final: ${finalHeight}px`
      )
      console.log('PWATopBar debug:', {
        computedHeight,
        heightValue,
        fallbackHeight,
        finalHeight,
        isPWA,
        userAgent: navigator.userAgent,
        screenDimensions: { width: window.screen.width, height: window.screen.height },
      })
    }
  }, [isPWA])

  if (!isPWA) return null

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-[9999] bg-sky-700 dark:bg-gray-800"
        style={{
          height: safeAreaHeight > 0 ? `${safeAreaHeight}px` : 'env(safe-area-inset-top, 0px)',
          maxHeight: '50px',
        }}
      />
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 left-2 z-[10000] max-w-xs rounded bg-red-500 p-1 text-xs text-white">
          PWA: {isPWA ? 'YES' : 'NO'} | Height: {safeAreaHeight}px | {debugInfo}
        </div>
      )}
    </>
  )
}

// Component for the bottom navigation bar (frosted glass effect)
export const PWABottomNav = () => {
  const isPWA = usePWA()
  const router = useRouter()

  if (!isPWA) return null

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-[2000] flex items-center justify-between bg-white/75 backdrop-blur-md dark:bg-gray-800/75"
      style={{
        height: 'calc(env(safe-area-inset-bottom) + 50px)',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        paddingBottom: 'calc(env(safe-area-inset-bottom) - 30px)',
      }}
    >
      <button
        aria-label="Back"
        onClick={() => router.back()}
        className="rounded-full p-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <IoChevronBackOutline size="28px" />
      </button>
      <button
        aria-label="Forward"
        onClick={() => router.forward()}
        className="rounded-full p-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
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
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 50px)',
        width: '100%',
      }}
    >
      {children}
    </div>
  )
}
