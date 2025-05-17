/** @format */

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Flex,
  Icon,
  Button,
  Link,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'

// Natural sort function
const naturalSort = (a, b) => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  return collator.compare(a, b)
}

const SearchIcon = (props) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width="20px"
    height="20px"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const SearchBar = ({ initialQuery = '', initialCategory = '', onImageSearch }) => {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [categoriesForDropdown, setCategoriesForDropdown] = useState([])
  const router = useRouter()
  const searchTimeout = useRef(null)
  const linkColor = useColorModeValue('blue.500', 'blue.300')

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()

        // Split categories into parent and child categories
        const parentCategories = data.categories
          .filter((cat) => !cat.parent_id || cat.parent_id === '')
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            isParent: true,
            parts_count: cat.parts_count || 0,
          }))

        const childCategories = data.categories
          .filter((cat) => cat.parent_id && cat.parent_id !== '')
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            isParent: false,
            parts_count: cat.parts_count || 0,
          }))

        // Sort both groups using natural sort
        parentCategories.sort((a, b) => naturalSort(a.name, b.name))
        childCategories.sort((a, b) => naturalSort(a.name, b.name))

        // Add separator between parent and child categories if we have both
        let combinedCategories = [...parentCategories]

        if (parentCategories.length > 0 && childCategories.length > 0) {
          combinedCategories.push({
            id: 'separator',
            name: '──── Sub Categories ────',
            isParent: false,
          })
        }

        combinedCategories = [...combinedCategories, ...childCategories]

        setCategoriesForDropdown(combinedCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Initialize from URL on component mount
  useEffect(() => {
    if (router.isReady) {
      const { q, category } = router.query
      // Clear query if not present in URL (important for category-only searches)
      setQuery(q || '')
      // Clear category selection if not in URL
      setCategory(category || '')
    }
  }, [router.isReady, router.query])

  // Handle input change with simple timeout
  const handleInputChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Set a new timeout
    searchTimeout.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (newQuery) params.append('q', newQuery)
      if (category) params.append('category', category)

      router.push(`/?${params.toString()}`)
    }, 500)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [])

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    // Clear any pending timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    handleSearch()
  }

  // Handle "Enter" key in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Clear any pending timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
      handleSearch()
    }
  }

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value
    setCategory(newCategory)

    // Clear any pending timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Automatically trigger search when category changes
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (newCategory) params.append('category', newCategory)

    router.push(`/?${params.toString()}`)
  }

  // Perform search
  const handleSearch = () => {
    // If both query and category are empty, reset to default state
    if (!query && !category) {
      router.push('/')
      return
    }

    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (category) params.append('category', category)

    router.push(`/?${params.toString()}`)
  }

  return (
    <Box width="100%">
      <form onSubmit={handleSubmit}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={2} align="flex-end" wrap="wrap">
          <Box width={{ base: '100%', md: 'auto' }} flex={{ md: 1 }} minW={0}>
            <InputGroup>
              <InputLeftElement pointerEvents="none" height="100%" display="flex" alignItems="center" pl="3">
                <Icon as={SearchIcon} color="gray.300" boxSize="20px" />
              </InputLeftElement>
              <Input
                placeholder="Search for part number or name..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                size="lg"
                borderRadius="md"
              />
              {query && (
                <InputRightElement height="100%" display="flex" alignItems="center" pr="3">
                  <IconButton
                    aria-label="Clear search"
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    }
                    size="sm"
                    minH="30px"
                    variant="ghost"
                    onClick={() => {
                      setQuery('')
                      // Clear any pending timeout
                      if (searchTimeout.current) {
                        clearTimeout(searchTimeout.current)
                      }
                      // Update the URL to remove the query param
                      const params = new URLSearchParams()
                      if (category) params.append('category', category)
                      router.push(`/?${params.toString()}`)
                    }}
                    tabIndex={-1}
                    boxSize="20px"
                    p={0}
                  />
                </InputRightElement>
              )}
            </InputGroup>
          </Box>

          <Flex direction="row" gap={2} width={{ base: '100%', md: 'auto' }}>
            <Box flex={1} minW={0}>
              <Select
                placeholder="All Categories"
                value={category}
                onChange={handleCategoryChange}
                size="lg"
                borderRadius="md"
              >
                {categoriesForDropdown.map((cat, index) =>
                  cat.id === 'separator' ? (
                    <option key="separator" disabled style={{ fontWeight: 'bold', color: 'gray' }}>
                      ──── Sub Categories ────
                    </option>
                  ) : (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                      {cat.parts_count > 0 ? ` (${cat.parts_count.toLocaleString()} parts)` : ''}
                    </option>
                  )
                )}
              </Select>
            </Box>
            <Button type="submit" colorScheme="blue" size="lg" onClick={handleSearch} minW="64px">
              Go
            </Button>
          </Flex>
          {onImageSearch && (
            <Link
              w="100%"
              as="button"
              fontSize="lg"
              onClick={onImageSearch}
              color={linkColor}
              _hover={{ textDecoration: 'underline', color: useColorModeValue('blue.600', 'blue.300') }}
              mt={0}
            >
              <Flex alignItems="center" gap={2} justifyContent="center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20px" height="20px">
                  <path
                    fill="currentColor"
                    d="M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"
                  />
                </svg>
                <span>Image Search</span>
              </Flex>
            </Link>
          )}
        </Flex>
      </form>
    </Box>
  )
}

export default SearchBar
