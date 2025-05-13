/** @format */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Container,
  Heading,
  Link,
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
import Head from 'next/head'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import SearchResults from '../components/SearchResults'
import PartDetailModal from '../components/PartDetailModal'
import ImageSearchModal from '../components/ImageSearchModal'
import Footer from '../components/Footer'

export default function Home() {
  const router = useRouter()
  const { q, category, part } = router.query
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const linkColor = useColorModeValue('blue.500', 'blue.300')

  const [results, setResults] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [subcategoryCount, setSubcategoryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isPartModalOpen, setIsPartModalOpen] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState(null)
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false)

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

  // Handle direct part access via URL
  useEffect(() => {
    if (router.isReady && part) {
      setSelectedPartId(part)
      setIsPartModalOpen(true)
    }
  }, [part, router.isReady])

  const handlePartModalClose = () => {
    setIsPartModalOpen(false)
    // Remove the part parameter from the URL without refreshing the page
    const { part, ...restQuery } = router.query
    router.replace(
      {
        pathname: router.pathname,
        query: restQuery,
      },
      undefined,
      { shallow: true }
    )
  }

  // This function will be passed down to SearchResults
  const handlePartClick = (partId) => {
    setSelectedPartId(partId)
    setIsPartModalOpen(true)

    // Update URL to include part ID without page refresh
    const newQuery = { ...router.query, part: partId }
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    )
  }

  const handleImageSearchModalOpen = () => {
    setIsImageSearchModalOpen(true)
  }

  const handleImageSearchModalClose = () => {
    setIsImageSearchModalOpen(false)
  }

  const handleImageSubmit = async (imageData) => {
    // This function will handle the image data after submission from the modal
    // For now, we'll just log it and close the modal.
    // Later, this will trigger a new search or display results based on the API response.
    console.log('Image submitted, data:', imageData)
    // Example: You might want to fetch results based on the image submission here
    // or update the UI to show that an image search is in progress.
    setIsImageSearchModalOpen(false)
    // Potentially, you could set loading state here and call another fetch function
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <Head>
        <title>LEGO Part Label Search</title>
        <meta name="description" content="Search and create labels for LEGO parts" />
      </Head>

      <Header />

      <Container maxW="container.2xl" pt={4} pb={3}>
        <VStack spacing={2} align="stretch">
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
            <SearchResults
              results={results}
              totalResults={totalResults}
              subcategoryCount={subcategoryCount}
              onPartClick={handlePartClick}
            />
          )}

          {/* Initial state - show welcome message */}
          {!isLoading && !error && !hasSearched && (
            <Box textAlign="center" pt={4} pb={32}>
              <Text color={textColor} fontSize="lg">
                Enter a search term, select a category,
                <br />
                or&nbsp;
                <Link
                  as="button"
                  onClick={handleImageSearchModalOpen}
                  color={linkColor}
                  _hover={{ textDecoration: 'underline', color: useColorModeValue('blue.600', 'blue.300') }}
                >
                  {' '}
                  search using an image
                </Link>
              </Text>
            </Box>
          )}
        </VStack>
      </Container>

      {/* Part Detail Modal for direct URL access */}
      <PartDetailModal isOpen={isPartModalOpen} onClose={handlePartModalClose} partId={selectedPartId} />
      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={isImageSearchModalOpen}
        onClose={handleImageSearchModalClose}
        onImageSubmit={handleImageSubmit}
      />
      <Footer />
    </Box>
  )
}
