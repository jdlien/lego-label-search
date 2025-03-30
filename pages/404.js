/** @format */

import React from 'react'
import { Box, Heading, Text, Button, Container, VStack, Image } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'

export default function Custom404() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Page Not Found | LEGO Part Label Maker</title>
        <meta name="description" content="Page not found - LEGO Part Label Maker" />
      </Head>

      <Header />

      <Container maxW="container.md" py={20}>
        <VStack spacing={8} textAlign="center">
          <Heading size="2xl">404 - Page Not Found</Heading>

          <Text fontSize="xl">Oops! We couldn't find the page you're looking for.</Text>

          <Box textAlign="center" py={8}>
            {/* ASCII art of a simple brick */}
            <Box
              as="pre"
              fontFamily="monospace"
              whiteSpace="pre"
              fontSize={{ base: 'sm', md: 'md' }}
              color="brand.500"
              mb={8}
            >
              {`
   _______________
  /               \\
 /                 \\
+-+-+-+-+-+-+-+-+-+-+
| | | | | | | | | | |
| | | | | | | | | | |
+-+-+-+-+-+-+-+-+-+-+
              `}
            </Box>
          </Box>

          <Button colorScheme="blue" size="lg" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </VStack>
      </Container>
    </>
  )
}
