/** @format */

import { useState, useEffect, useCallback } from 'react'
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
  const [allCategories, setAllCategories] = useState([])
  const [categoriesForDropdown, setCategoriesForDropdown] = useState([])
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [debouncedCategory, setDebouncedCategory] = useState(initialCategory)
  const router = useRouter()

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()

        setAllCategories(data.categories)

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

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300) // 300ms delay

    return () => clearTimeout(timerId)
  }, [query])

  // Debounce category change
  useEffect(() => {
    setDebouncedCategory(category)
  }, [category])

  // Trigger search when debounced values change
  useEffect(() => {
    if (router.isReady) {
      const params = new URLSearchParams()
      if (debouncedQuery) params.append('q', debouncedQuery)
      if (debouncedCategory) params.append('category', debouncedCategory)

      const url = `/?${params.toString()}`

      // Only update URL if it's different from current
      if (url !== router.asPath) {
        router.push(url, undefined, { shallow: true })
      }
    }
  }, [debouncedQuery, debouncedCategory, router.isReady])

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
              onChange={(e) => setQuery(e.target.value)}
              size="lg"
              borderRadius="md"
            />
          </InputGroup>
        </Box>

        <Box width={{ base: '100%', md: '300px' }}>
          <Select
            placeholder="All Categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
