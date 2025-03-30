/** @format */

import { Box, Flex, Heading, Spacer, Link, Button, IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const bgColor = useColorModeValue('brand.700', 'gray.800')
  const buttonHoverBg = useColorModeValue('brand.600', 'gray.700')

  return (
    <Box as="header" bg={bgColor} color="white" px={4} py={2} boxShadow="md">
      <Flex align="center" maxW="1200px" mx="auto">
        <Heading as="h1" size="lg">
          <NextLink href="/" passHref legacyBehavior>
            <Link _hover={{ textDecoration: 'none' }}>LEGO Part Label Maker</Link>
          </NextLink>
        </Heading>
        <Spacer />
        <Flex gap={4} align="center">
          <NextLink href="/" passHref legacyBehavior>
            <Button as="a" variant="ghost" _hover={{ bg: buttonHoverBg }}>
              Search
            </Button>
          </NextLink>
          <NextLink href="/categories" passHref legacyBehavior>
            <Button as="a" variant="ghost" _hover={{ bg: buttonHoverBg }}>
              Categories
            </Button>
          </NextLink>
          <NextLink href="/about" passHref legacyBehavior>
            <Button as="a" variant="ghost" _hover={{ bg: buttonHoverBg }}>
              About
            </Button>
          </NextLink>
          <IconButton
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            _hover={{ bg: buttonHoverBg }}
          />
        </Flex>
      </Flex>
    </Box>
  )
}

export default Header
