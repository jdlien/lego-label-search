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
  useColorModeValue,
} from '@chakra-ui/react'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import SearchResults from '../components/SearchResults'

export default function Home() {
  const router = useRouter()
  const { q, category } = router.query
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const [results, setResults] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [subcategoryCount, setSubcategoryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Fetch search results when query parameters change
  useEffect(() => {
    const fetchResults = async () => {
      // Only search if router is ready and we have query params
      if (!router.isReady || (!q && !category)) {
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

        // Calculate subcategory count if categories info is provided
        if (data.categories && Array.isArray(data.categories)) {
          // Subtract 1 because one of the categories is the main selected category
          setSubcategoryCount(Math.max(0, data.categories.length - 1))
        } else {
          setSubcategoryCount(0)
        }
      } catch (err) {
        console.error('Search error:', err)
        setError(err.message)
        setResults([])
        setTotalResults(0)
        setSubcategoryCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [q, category, router.isReady])

  return (
    <Box minH="100vh" bg={pageBg}>
      <Header />

      <Container maxW="container.2xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={4}>
            <Heading as="h1" size="xl" mb={2}>
              Find LEGO Parts
            </Heading>
            <Text color={textColor}>Search by part number, name, or category to create printable labels</Text>
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
          {!isLoading && !error && hasSearched && (
            <SearchResults results={results} totalResults={totalResults} subcategoryCount={subcategoryCount} />
          )}

          {/* Initial state - show welcome message */}
          {!isLoading && !error && !hasSearched && (
            <Box textAlign="center" py={10}>
              <Text color={textColor} fontSize="lg">
                Enter a search term and click the Search button
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
