/** @format */

import { ChakraProvider, extendTheme, ColorModeScript, useColorModeValue } from '@chakra-ui/react'
import Head from 'next/head'
import { useEffect, useState } from 'react'

// Extend the theme to customize the app
const theme = extendTheme({
  fonts: {
    heading: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
  },
  colors: {
    brand: {
      50: '#f7fafc',
      100: '#edf2f7',
      500: '#4299E1',
      600: '#3182ce',
      700: '#2b6cb0',
      900: '#1a365d',
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
})

function MyApp({ Component, pageProps }) {
  // Create a component that will update the theme-color meta tag based on color mode
  function ThemeColorMetaTag() {
    const themeColor = useColorModeValue('#2b6cb0', '#1A202C') // Light bg / Dark bg
    const [mounted, setMounted] = useState(false)

    // Only render after mounting to prevent hydration mismatch
    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) return null

    return <meta name="theme-color" content={themeColor} />
  }

  return (
    <>
      <Head>
        {/* Favicon - Legacy browsers */}
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        {/* SVG Favicon - Modern Browsers */}
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        {/* PNG fallbacks for specific sizes (if needed) */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS status bar style */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* PWA/Android support */}
        <link rel="manifest" href="/icons/manifest.json" />
      </Head>
      {/* This will render the theme-color meta tag dynamically */}
      <ThemeColorMetaTag />
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  )
}

export default MyApp
