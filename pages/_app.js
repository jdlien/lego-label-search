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

// Simple hook to update theme color
function useUpdateThemeColor() {
  const { colorMode } = useColorMode()

  // Update as early as possible during render
  useEffect(() => {
    // Function to update the theme color
    const updateThemeColor = () => {
      const themeColor = colorMode === 'dark' ? '#1A202C' : '#2b6cb0'
      const metaTag = document.querySelector('meta[name="theme-color"]')
      if (metaTag) {
        metaTag.setAttribute('content', themeColor)
        console.log('Theme color updated to', themeColor, 'for mode', colorMode)
      }
    }

    // Update immediately
    updateThemeColor()

    // Also update after everything is fully loaded
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        // If already loaded, update again after a small delay
        setTimeout(updateThemeColor, 100)
      } else {
        // Otherwise wait for load event
        window.addEventListener('load', updateThemeColor)
        return () => window.removeEventListener('load', updateThemeColor)
      }
    }
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
        {/* Theme color - will be updated by JS */}
        <meta name="theme-color" content="#2b6cb0" />
        {/* PWA/Android support */}
        <link rel="manifest" href="/icons/manifest.json" />

        {/* Direct script to update theme color for iOS home screen */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          // Function to update theme color
          function updateThemeColor() {
            // Try to get the color mode from localStorage
            const storedMode = localStorage.getItem('chakra-ui-color-mode');

            // Check if dark mode is preferred by the system
            const prefersDark = window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: dark)').matches;

            // Determine the current mode
            const isDarkMode = storedMode === 'dark' ||
              (storedMode !== 'light' && prefersDark);

            // Set the appropriate color
            const themeColor = isDarkMode ? '#1A202C' : '#2b6cb0';

            // Update the meta tag
            const metaTag = document.querySelector('meta[name="theme-color"]');
            if (metaTag) {
              metaTag.setAttribute('content', themeColor);
              console.log('Direct script updated theme color to', themeColor);
            }
          }

          // Run immediately
          updateThemeColor();

          // Also run when page is fully loaded
          window.addEventListener('load', updateThemeColor);

          // Watch for color scheme changes
          if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)')
              .addEventListener('change', updateThemeColor);
          }
        `,
          }}
        ></script>
      </Head>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
        <ThemeUpdater />
      </ChakraProvider>
    </>
  )
}

// Simple component to use our hook
function ThemeUpdater() {
  useUpdateThemeColor()
  return null
}

export default MyApp
