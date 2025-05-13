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

// Custom hook to update theme-color based on color mode
function useThemeColorMetaTag() {
  const { colorMode } = useColorMode()

  useEffect(() => {
    // Make sure we're in the browser
    if (typeof window === 'undefined') return

    const themeColor = colorMode === 'dark' ? '#1A202C' : '#2b6cb0'
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')

    if (!metaThemeColor) {
      // Create the meta tag if it doesn't exist
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }

    // Update the content
    metaThemeColor.setAttribute('content', themeColor)

    // For debugging - you can remove this after confirming it works
    console.log('Theme color updated to:', themeColor, 'for mode:', colorMode)
  }, [colorMode])
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Initial theme color (will be overridden dynamically) */}
        <meta name="theme-color" content="#2b6cb0" />
        {/* PWA/Android support */}
        <link rel="manifest" href="/icons/manifest.json" />
        {/* Script to detect and set initial theme color before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check if user prefers dark mode
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

                // Get stored theme preference if available (from localStorage)
                const storedTheme = localStorage.getItem('chakra-ui-color-mode');

                // Determine theme: stored preference or system preference
                const theme = storedTheme || (prefersDark ? 'dark' : 'light');

                // Set the appropriate theme color
                const themeColor = theme === 'dark' ? '#1A202C' : '#2b6cb0';

                // Find the theme-color meta tag and update it
                let metaTag = document.querySelector('meta[name="theme-color"]');
                if (metaTag) {
                  metaTag.setAttribute('content', themeColor);
                }
              })();
            `,
          }}
        />
      </Head>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
        <ThemeColorUpdater />
      </ChakraProvider>
    </>
  )
}

// This component uses the custom hook
function ThemeColorUpdater() {
  const { colorMode, setColorMode } = useColorMode()

  // Force a check of the color mode on initial load
  useEffect(() => {
    // Get the stored theme from localStorage
    const storedTheme = localStorage.getItem('chakra-ui-color-mode')

    // Check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    // If there's a stored theme and it doesn't match the current colorMode, force update
    if (storedTheme && storedTheme !== colorMode) {
      setColorMode(storedTheme)
    }
    // If no stored theme but system prefers dark and colorMode isn't dark, set to dark
    else if (!storedTheme && prefersDark && colorMode !== 'dark') {
      setColorMode('dark')
    }
  }, [])

  useThemeColorMetaTag()
  return null
}

export default MyApp
