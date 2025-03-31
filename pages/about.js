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
} from '@chakra-ui/react'
import Header from '../components/Header'

export default function About() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Header />

      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={4}>
              About LEGO Part Label Maker
            </Heading>
            <Text fontSize="lg">
              This application helps LEGO enthusiasts create and print labels for organizing their parts collection.
            </Text>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Data Source
            </Heading>
            <Text mb={4}>
              The data for this application comes from the Brick Architect website, which provides a comprehensive
              classification system for LEGO parts. The dataset includes:
            </Text>
            <UnorderedList spacing={2} pl={5} mb={4}>
              <ListItem>2,423 unique LEGO parts</ListItem>
              <ListItem>191 categories organized in a hierarchical structure</ListItem>
              <ListItem>14 top-level categories for broad classification</ListItem>
            </UnorderedList>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              All data is courtesy of Brick Architect and is used for educational purposes.
            </Alert>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              How to Use
            </Heading>
            <Text mb={2}>This application allows you to:</Text>
            <UnorderedList spacing={2} pl={5}>
              <ListItem>Search for LEGO parts by name or part number</ListItem>
              <ListItem>Browse parts by category using the hierarchical classification system</ListItem>
              <ListItem>Select parts to generate printable labels</ListItem>
              <ListItem>Organize your LEGO collection efficiently with clear labeling</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Technical Details
            </Heading>
            <Text mb={2}>This application is built with:</Text>
            <UnorderedList spacing={2} pl={5}>
              <ListItem>Next.js for the React framework</ListItem>
              <ListItem>Chakra UI for the component library</ListItem>
              <ListItem>Fuse.js for fuzzy search functionality</ListItem>
              <ListItem>Python scripts for data processing and preparation</ListItem>
            </UnorderedList>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
