/** @format */

import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import Head from 'next/head'

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

        {/* Single script to handle theme color */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            // Function to update the theme color
            function updateThemeColor() {
              // Get stored preference from localStorage
              const storedMode = localStorage.getItem('chakra-ui-color-mode');

              // Check system preference
              const prefersDark = window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches;

              // Determine the current mode - DARK has priority
              const isDarkMode = storedMode === 'dark' ||
                (storedMode !== 'light' && prefersDark);

              // Set color based on mode
              const themeColor = isDarkMode ? '#1A202C' : '#2b6cb0';

              // Update the meta tag
              const metaTag = document.querySelector('meta[name="theme-color"]');
              if (metaTag) {
                metaTag.setAttribute('content', themeColor);
                console.log('Theme color set to', themeColor, 'based on', isDarkMode ? 'dark' : 'light', 'mode');
              }
            }

            // Run immediately
            updateThemeColor();

            // Run when color mode changes in localStorage
            function handleStorageChange(e) {
              if (e.key === 'chakra-ui-color-mode') {
                updateThemeColor();
              }
            }

            // Run on page load completion
            window.addEventListener('load', updateThemeColor);

            // Listen for changes to localStorage
            window.addEventListener('storage', handleStorageChange);

            // Check periodically for 5 seconds after page load
            let checkCount = 0;
            const maxChecks = 10;
            const checkInterval = setInterval(() => {
              updateThemeColor();
              checkCount++;
              if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
              }
            }, 500);

            // Also listen for color scheme changes
            if (window.matchMedia) {
              window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', updateThemeColor);
            }
          })();
        `,
          }}
        ></script>
      </Head>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  )
}

export default MyApp
