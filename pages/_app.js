/** @format */

import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'

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
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  )
}

export default MyApp
