/** @format */

import { useState, useEffect, useRef } from 'react'
import { Box, Input, InputGroup, InputLeftElement, Select, Flex, Icon, Button } from '@chakra-ui/react'
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
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const SearchBar = ({ initialQuery = '', initialCategory = '' }) => {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [categoriesForDropdown, setCategoriesForDropdown] = useState([])
  const router = useRouter()
  const searchTimeout = useRef(null)

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
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
          <Box flex="1">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={SearchIcon} color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search for part number or name..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                size="lg"
                borderRadius="md"
              />
            </InputGroup>
          </Box>

          <Box width={{ base: '100%', md: '300px' }}>
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

          <Button type="submit" colorScheme="blue" size="lg" onClick={handleSearch}>
            Search
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default SearchBar
