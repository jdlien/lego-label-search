/** @format */

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  UnorderedList,
  ListItem,
  Link,
  Alert,
  AlertIcon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function About() {
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const linkColor = useColorModeValue('blue.500', 'blue.300')

  return (
    <Box minH="100vh" bg={pageBg}>
      <Header />

      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={4}>
              About LEGO Part Label Search
            </Heading>
            <Text fontSize="lg" color={textColor}>
              This application helps LEGO enthusiasts create and print labels for organizing their parts collection.
              Developed by JD Lien. Source code available at{' '}
              <Link
                href="https://github.com/jdlien/lego-label-search"
                color={linkColor}
                _hover={{ textDecoration: 'underline', color: useColorModeValue('blue.600', 'blue.300') }}
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/jdlien/lego-label-search
              </Link>
              .
            </Text>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Data Source
            </Heading>
            <Text mb={4} color={textColor}>
              The category data and part names for this application comes from the Brick Architect website, which
              provides a comprehensive classification system for LEGO parts. The dataset includes:
            </Text>
            <UnorderedList spacing={2} pl={5} mb={4} color={textColor}>
              <ListItem>2,423 unique LEGO parts</ListItem>
              <ListItem>191 categories organized in a hierarchical structure</ListItem>
              <ListItem>14 top-level categories for broad classification</ListItem>
              <ListItem>
                Over 21,000 original images generated using{' '}
                <Link
                  href="https://github.com/jdlien/lbx-utils"
                  color={linkColor}
                  _hover={{ textDecoration: 'underline', color: useColorModeValue('blue.600', 'blue.300') }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  jdlien/lbx-utils
                </Link>{' '}
                using LDView
              </ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              How to Use
            </Heading>
            <Text mb={2} color={textColor}>
              This application allows you to:
            </Text>
            <UnorderedList spacing={2} pl={5} color={textColor}>
              <ListItem>Search for LEGO parts by name or part number</ListItem>
              <ListItem>Browse parts by category using the hierarchical classification system</ListItem>
              <ListItem>
                For many parts, you can download a printable label in 12mm or 24mm size (courtesy of BrickArchitect.com)
              </ListItem>
              <ListItem>Organize your LEGO collection efficiently with clear labeling</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Technical Details
            </Heading>
            <Text mb={2} color={textColor}>
              This application is built with:
            </Text>
            <UnorderedList spacing={2} pl={5} color={textColor}>
              <ListItem>Next.js for the React framework</ListItem>
              <ListItem>Chakra UI for the component library</ListItem>
              <ListItem>Python scripts for data processing and preparation</ListItem>
            </UnorderedList>
          </Box>
        </VStack>
      </Container>
      <Footer />
    </Box>
  )
}
