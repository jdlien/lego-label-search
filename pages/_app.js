/** @format */

import { ChakraProvider, extendTheme, ColorModeScript, useColorMode } from '@chakra-ui/react'
import Head from 'next/head'
import { useEffect } from 'react'

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

// Component to update theme-color meta tag based on color mode
const ThemeColorMetaUpdater = () => {
  const { colorMode } = useColorMode()

  // The content for the meta tag will be derived directly from colorMode
  const currentThemeColor = colorMode === 'dark' ? '#1A202C' : '#2b6cb0'

  useEffect(() => {
    // Optional: Log when the color mode or theme color changes to help debugging
    console.log(
      `ThemeColorMetaUpdater: colorMode is ${colorMode}, theme-color will be set to ${currentThemeColor} via next/head`
    )
  }, [colorMode, currentThemeColor])

  return (
    <Head>
      {/* Add a key for efficient updates by Next.js */}
      <meta name="theme-color" key="theme-color" content={currentThemeColor} />
    </Head>
  )
}

function MyApp({ Component, pageProps }) {
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Theme color will now be managed by ThemeColorMetaUpdater */}
        {/* <meta name="theme-color" content="#2b6cb0" /> */}
        {/* PWA/Android support */}
        <link rel="manifest" href="/icons/manifest.json" />
      </Head>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <ThemeColorMetaUpdater />
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  )
}

export default MyApp
