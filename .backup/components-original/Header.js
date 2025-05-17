/** @format */

import { Box, Flex, Heading, Spacer, Link, Button, IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { MoonIcon, SunIcon, HamburgerIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const bgColor = useColorModeValue('brand.700', 'gray.800')
  const buttonHoverBg = useColorModeValue('brand.600', 'gray.700')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  const currentPath = router.pathname

  return (
    <Box as="header" bg={bgColor} color="white" px={4} py={2} boxShadow="md">
      <Flex align="center" maxW="1200px" mx="auto">
        <Heading as="h1" size="lg">
          <NextLink href="/" passHref legacyBehavior>
            <Link _hover={{ textDecoration: 'none' }} display="flex" alignItems="center" gap={3}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="50px">
                <path fill="#3334" d="M37.3 59.8v34.5L2 60.3V25.8l35.3 34Z" />
                <path fill="#fff4" d="M37.3 59.8v34.5l60.5-19.9V39.8l-60.5 20Z" />
                <path
                  fill="currentColor"
                  d="m55.3 6.8 7.3-2.4 36.2 35v35.7L37.2 95.5 1 60.7V25l15.8-5.3.6-.5a14 14 0 0 1 8.7-2.6l21.7-7.3a14 14 0 0 1 7.5-2.5ZM15.2 22.4 3.9 26.2l33.7 32.4 58.3-19.2-29.4-28.5c.5.8.8 1.6.8 2.5v4.9c0 1.5-.8 3-2.3 4.1-2 1.5-5 2.5-8.6 2.5a14 14 0 0 1-8.5-2.5 5.2 5.2 0 0 1-2.3-4.1v-5c0-.4 0-.8.2-1.2l-15.1 5a12 12 0 0 1 4.3 2c1.5 1.3 2.3 2.7 2.3 4.3v5c0 1.6-.8 3-2.3 4.3a15 15 0 0 1-8.8 2.6c-3.6 0-6.8-1-8.8-2.6-1.5-1.2-2.3-2.7-2.3-4.2v-6.1ZM64.4 8.9l-2.3-2.3-1.8.6c1.6.3 3 1 4.1 1.6Zm-28 83V60.2L3 28v31.8l33.3 32Zm60.4-50.7L38.3 60.5v32.4l58.5-19.2V41.2ZM32.2 46v-5.2c0-1.6.9-3 2.4-4.3a15 15 0 0 1 9-2.6c3.7 0 7 1 9 2.6 1.5 1.2 2.4 2.7 2.4 4.3V46c0 1.6-.9 3-2.4 4.3a15 15 0 0 1-9 2.6c-3.7 0-7-1-9-2.6-1.5-1.2-2.4-2.7-2.4-4.3Zm11.4-10.1c-5.2 0-9.4 2.2-9.4 5s4.2 5 9.4 5 9.4-2.2 9.4-5-4.2-5-9.4-5Zm19.3.1v-5c0-1.6.8-3 2.3-4.2a14 14 0 0 1 8.7-2.6c3.6 0 6.8 1 8.8 2.6C84 28 85 29.4 85 31v5c0 1.6-.9 3-2.3 4.2-2 1.5-5.2 2.6-8.8 2.6s-6.8-1-8.7-2.6c-1.5-1.2-2.4-2.6-2.4-4.2Zm11-9.9c-5 0-9.2 2.2-9.2 5 0 2.7 4.1 4.9 9.2 4.9 5 0 9.2-2.2 9.2-5 0-2.7-4.1-4.9-9.2-4.9Zm-47.7-7.6c-5.1 0-9.2 2.2-9.2 5 0 2.7 4.1 5 9.2 5s9.2-2.3 9.2-5c0-2.8-4.1-5-9.2-5Zm30.2-9.9c-5 0-9 2.2-9 4.9 0 2.6 4 4.8 9 4.8s9-2.2 9-4.8c0-2.7-4-4.9-9-4.9Z"
                />
                <path
                  fill="#3334"
                  d="M34.1 44.4v2.8s1.2 3.4 8.5 3.8v-3s-6.1 0-8.5-3.6Zm30.6-10.2V37s.8 3.4 8 3.7v-3s-5.7.1-8-3.5ZM17 26.7v2.6s.5 3.2 7.8 3.9v-3s-5.5 0-7.8-3.5Zm30.5-10.1v2.6s.5 3.2 7.8 3.9v-3s-5.5 0-7.8-3.5Z"
                />
              </svg>
              <div>Brck Label Search</div>
            </Link>
          </NextLink>
        </Heading>
        <Spacer />
        {/* Desktop Nav */}
        <Flex gap={4} align="center" display={{ base: 'none', md: 'flex' }}>
          <NextLink href="/" passHref legacyBehavior>
            <Button
              as="a"
              color="white"
              variant="ghost"
              _hover={{ bg: buttonHoverBg }}
              sx={currentPath === '/' ? { bg: 'whiteAlpha.300' } : {}}
            >
              Search
            </Button>
          </NextLink>
          <NextLink href="/categories" passHref legacyBehavior>
            <Button
              as="a"
              color="white"
              variant="ghost"
              _hover={{ bg: buttonHoverBg }}
              sx={currentPath === '/categories' ? { bg: 'whiteAlpha.300' } : {}}
            >
              Categories
            </Button>
          </NextLink>
          <NextLink href="/about" passHref legacyBehavior>
            <Button
              as="a"
              color="white"
              variant="ghost"
              _hover={{ bg: buttonHoverBg }}
              sx={currentPath === '/about' ? { bg: 'whiteAlpha.300' } : {}}
            >
              About
            </Button>
          </NextLink>
          <IconButton
            color="white"
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            _hover={{ bg: buttonHoverBg }}
          />
        </Flex>
        {/* Mobile Nav: Hamburger + Drawer */}
        <Flex align="center" display={{ base: 'flex', md: 'none' }}>
          <IconButton
            color="white"
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={onOpen}
            mr={2}
          />
          <IconButton
            color="white"
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            _hover={{ bg: buttonHoverBg }}
          />
          <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent bg={bgColor} color="white" pt="env(safe-area-inset-top, 0)">
              <DrawerCloseButton top="calc(env(safe-area-inset-top, 0px) + 14px)" />
              <DrawerHeader>Menu</DrawerHeader>
              <DrawerBody>
                <Flex direction="column" gap={4}>
                  <NextLink href="/" passHref legacyBehavior>
                    <Button
                      color="white"
                      as="a"
                      variant="ghost"
                      onClick={onClose}
                      _hover={{ bg: buttonHoverBg }}
                      sx={currentPath === '/' ? { bg: 'whiteAlpha.300' } : {}}
                    >
                      Search
                    </Button>
                  </NextLink>
                  <NextLink href="/categories" passHref legacyBehavior>
                    <Button
                      color="white"
                      as="a"
                      variant="ghost"
                      onClick={onClose}
                      _hover={{ bg: buttonHoverBg }}
                      sx={currentPath === '/categories' ? { bg: 'whiteAlpha.300' } : {}}
                    >
                      Categories
                    </Button>
                  </NextLink>
                  <NextLink href="/about" passHref legacyBehavior>
                    <Button
                      color="white"
                      as="a"
                      variant="ghost"
                      onClick={onClose}
                      _hover={{ bg: buttonHoverBg }}
                      sx={currentPath === '/about' ? { bg: 'whiteAlpha.300' } : {}}
                    >
                      About
                    </Button>
                  </NextLink>
                </Flex>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </Flex>
      </Flex>
    </Box>
  )
}

export default Header
