/** @format */

import { useState, useEffect } from 'react'
import { Box, Input, InputGroup, InputLeftElement, Select, Flex, Icon, Button } from '@chakra-ui/react'
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

  // Initialize from URL on component mount
  useEffect(() => {
    if (router.isReady) {
      const { q, category } = router.query
      if (q !== undefined) setQuery(q)
      if (category !== undefined) setCategory(category)
    }
  }, [router.isReady])

  // Perform search
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (category) params.append('category', category)

    router.push(`/?${params.toString()}`)
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  // Handle "Enter" key in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
                onChange={(e) => setQuery(e.target.value)}
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

          <Button type="submit" colorScheme="blue" size="lg" onClick={handleSearch}>
            Search
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default SearchBar
