/** @format */

import { Box, Text, useColorModeValue, Link } from '@chakra-ui/react'

export default function Footer() {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const linkColor = useColorModeValue('blue.500', 'blue.300')
  const bg = useColorModeValue('gray.100', 'gray.800')
  const color = useColorModeValue('gray.600', 'gray.400')
  const year = new Date().getFullYear()
  return (
    <Box as="footer" w="100%" mt={6} py={2} bg={bg} textAlign="center">
      <Text fontSize="sm" color={color}>
        &copy; {year} JD Lien. Source available on{' '}
        <Link
          href="https://github.com/jdlien/lego-label-search"
          color={linkColor}
          _hover={{ textDecoration: 'underline', color: useColorModeValue('blue.600', 'blue.300') }}
          isExternal
        >
          GitHub
        </Link>
        .
      </Text>
    </Box>
  )
}
