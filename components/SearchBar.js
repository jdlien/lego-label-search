/** @format */

import { useState, useEffect, useRef } from 'react'
import { Box, Input, InputGroup, InputLeftElement, Select, Flex, Icon } from '@chakra-ui/react'
import { useRouter } from 'next/router'

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
  const isInitialMount = useRef(true)
  const debounceTimerRef = useRef(null)

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()

        // Build hierarchical structure for dropdown
        const categoryTree = {}
        const topLevel = []

        // First map all categories for easy reference
        data.categories.forEach((cat) => {
          categoryTree[cat.id] = { ...cat, children: [] }
        })

        // Build tree structure
        data.categories.forEach((cat) => {
          const id = String(cat.id)
          const parentId = cat.parent_id ? String(cat.parent_id) : ''

          if (parentId && categoryTree[parentId]) {
            categoryTree[parentId].children.push(categoryTree[id])
          } else if (!parentId || parentId === '') {
            topLevel.push(categoryTree[id])
          }
        })

        // Sort top level categories by ID
        topLevel.sort((a, b) => {
          const aId = parseInt(a.id)
          const bId = parseInt(b.id)
          return aId - bId
        })

        // Create flat list with indentation for the dropdown
        const flattenedCategories = []

        // Recursive function to flatten the tree with proper indentation
        const flattenCategory = (category, level = 0) => {
          // Add the current category with indentation
          flattenedCategories.push({
            id: category.id,
            name: '  '.repeat(level) + category.name,
            level: level,
          })

          // Add all children recursively with increased indentation
          if (category.children && category.children.length > 0) {
            // Sort children by name
            category.children
              .sort((a, b) => a.name.localeCompare(b.name))
              .forEach((child) => flattenCategory(child, level + 1))
          }
        }

        // Process all top level categories
        topLevel.forEach((category) => flattenCategory(category))

        setCategoriesForDropdown(flattenedCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Handle user input changes with debounce
  const handleSearchChange = (newQuery) => {
    setQuery(newQuery)

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set a new timer to update the URL after debounce
    debounceTimerRef.current = setTimeout(() => {
      updateSearchParams(newQuery, category)
    }, 300)
  }

  // Handle category changes
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)

    // Category changes don't need debounce
    updateSearchParams(query, newCategory)
  }

  // Update URL with search parameters
  const updateSearchParams = (q, cat) => {
    if (!router.isReady) return

    const params = new URLSearchParams()
    if (q) params.append('q', q)
    if (cat) params.append('category', cat)

    const url = `/?${params.toString()}`

    // Only update URL if it's different from current
    if (url !== router.asPath) {
      router.push(url, undefined, { shallow: true })
    }
  }

  // Sync state with URL on initial load and when URL changes
  useEffect(() => {
    if (!router.isReady) return

    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const { q, category: urlCategory } = router.query

    // Only update state if it differs from current state
    // This prevents loops and double-changes
    if (q !== query) {
      setQuery(q || '')
    }

    if (urlCategory !== category) {
      setCategory(urlCategory || '')
    }
  }, [router.isReady, router.asPath, query, category])

  return (
    <Box width="100%">
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
        <Box flex="1">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search for part number or name..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="lg"
              borderRadius="md"
            />
          </InputGroup>
        </Box>

        <Box width={{ base: '100%', md: '300px' }}>
          <Select
            placeholder="All Categories"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            size="lg"
            borderRadius="md"
          >
            {categoriesForDropdown.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Box>
      </Flex>
    </Box>
  )
}

export default SearchBar
