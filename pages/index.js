/** @format */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import SearchResults from '../components/SearchResults'

export default function Home() {
  const router = useRouter()
  const { q, category } = router.query

  const [results, setResults] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Fetch search results when query parameters change
  useEffect(() => {
    const fetchResults = async () => {
      // Only search if we have a query or category
      if (!q && !category) {
        setResults([])
        setTotalResults(0)
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        const params = new URLSearchParams()
        if (q) params.append('q', q)
        if (category) params.append('category', category)

        // Set reasonable limit for results
        params.append('limit', '100')

        const response = await fetch(`/api/search?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch search results')
        }

        const data = await response.json()
        setResults(data.results)
        setTotalResults(data.total)
      } catch (err) {
        console.error('Search error:', err)
        setError(err.message)
        setResults([])
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if router is ready
    if (router.isReady) {
      fetchResults()
    }
  }, [q, category, router.isReady])

  return (
    <Box minH="100vh" bg="gray.50">
      <Header />

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={4}>
            <Heading as="h1" size="xl" mb={2}>
              Find LEGO Parts
            </Heading>
            <Text color="gray.600">Search by part number, name, or category to create printable labels</Text>
          </Box>

          <SearchBar initialQuery={q || ''} initialCategory={category || ''} />

          {/* Loading state */}
          {isLoading && (
            <Center py={6}>
              <Spinner size="lg" color="blue.500" thickness="4px" />
            </Center>
          )}

          {/* Error state */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle mr={2}>Search failed!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {!isLoading && !error && hasSearched && <SearchResults results={results} totalResults={totalResults} />}

          {/* Initial state - no search yet */}
          {!isLoading && !error && !hasSearched && (
            <Box textAlign="center" py={10}>
              <Text color="gray.500" fontSize="lg">
                Start typing to search for LEGO parts
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
