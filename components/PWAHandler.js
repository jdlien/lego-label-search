/** @format */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Box, Flex, IconButton, useColorModeValue } from '@chakra-ui/react'
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'

// Hook to detect PWA mode (standalone display)
export function usePWA() {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // This effect runs only on the client-side
    const checkPWA = () => window.matchMedia('(display-mode: standalone)').matches

    setIsPWA(checkPWA())

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e) => setIsPWA(e.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isPWA
}

// Component for the top safe area bar (frosted glass effect)
export const PWATopBar = () => {
  const isPWA = usePWA()
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.75)', 'rgba(26, 32, 44, 0.75)') // Light/Dark semi-transparent

  if (!isPWA) return null

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      height="env(safe-area-inset-top)"
      bg={bgColor}
      backdropFilter="blur(10px)"
      zIndex="1300" // Above most content, below modals
      pointerEvents="none" // Allow interactions with content behind, if any visible
    />
  )
}

// Component for the bottom navigation bar (frosted glass effect)
export const PWABottomNav = () => {
  const isPWA = usePWA()
  const router = useRouter()
  const bgColorNav = useColorModeValue('rgba(255, 255, 255, 0.75)', 'rgba(26, 32, 44, 0.75)')
  const iconColor = useColorModeValue('gray.700', 'gray.200')

  if (!isPWA) return null

  return (
    <Flex
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      height={`calc(env(safe-area-inset-bottom) + 30px)`} // 60px base height + safe area
      bg={bgColorNav}
      backdropFilter="blur(10px)"
      zIndex="1300"
      alignItems="center"
      justifyContent="space-between"
      // Padding respects safe areas for the content *within* the bar
      paddingLeft="calc(1rem + env(safe-area-inset-left))"
      paddingRight="calc(1rem + env(safe-area-inset-right))"
      paddingBottom="calc(env(safe-area-inset-bottom) - 24px)" // Ensures content is placed correctly within the bar's height
    >
      <IconButton
        aria-label="Back"
        icon={<IoChevronBackOutline size="28px" />}
        onClick={() => router.back()}
        variant="ghost"
        size="lg"
        color={iconColor}
        isRound
      />
      <IconButton
        aria-label="Forward"
        icon={<IoChevronForwardOutline size="28px" />}
        onClick={() => router.forward()}
        variant="ghost"
        size="lg"
        color={iconColor}
        isRound
      />
    </Flex>
  )
}

// Wrapper component to adjust main content padding for PWA fixed bars
export const PWAViewportAdjuster = ({ children }) => {
  const isPWA = usePWA()

  if (!isPWA) {
    // If not in PWA mode, render children directly without adjustment
    return <>{children}</>
  }

  return (
    <Box
      pt="env(safe-area-inset-top)"
      // 60px is the base height of the PWABottomNav before adding safe-area-inset-bottom
      pb={`calc(env(safe-area-inset-bottom) + 30px)`}
      width="100%"
      // Ensure the Box itself can take up height and allow scrolling for its content if needed
      // minHeight="100vh" // Or manage height/scrolling within the Component
      // boxSizing="border-box"
    >
      {children}
    </Box>
  )
}
