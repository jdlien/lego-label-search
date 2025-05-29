'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import InputField from './InputField'
import { IconMagnifyingGlass } from './InputField/InputIcons'

interface Category {
  id: string
  name: string
  parent_id?: string
  parts_count?: number
  sort_order?: number
  level?: number
  description?: string
}

interface CategoryForDropdown {
  value: string
  label: string
  disabled?: boolean
  group?: string | { key: string; display: string | React.ReactNode }
  description?: string
}

type SearchBarProps = {
  onImageSearch?: () => void
}

export default function SearchBar({ onImageSearch }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || ''

  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [categoriesForDropdown, setCategoriesForDropdown] = useState<CategoryForDropdown[]>([])
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [, startTransition] = useTransition()

  // Only sync from URL on initial mount to avoid feedback loops
  // The local state is the source of truth while typing

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()

        // Check if the response has categories and it's an array
        if (!data.categories || !Array.isArray(data.categories)) {
          console.error('Invalid categories response:', data)
          return
        }

        // Create a map for quick parent lookup
        const categoryMap = new Map<string, Category>(data.categories.map((cat: Category) => [String(cat.id), cat]))

        // First, separate root categories from subcategories
        const rootCategories = data.categories.filter((cat: Category) => cat.level === 0)
        const subcategories = data.categories.filter((cat: Category) => cat.level !== 0)

        // Sort root categories by their sort_order (1-12)
        rootCategories.sort((a: Category, b: Category) => {
          return (a.sort_order || 0) - (b.sort_order || 0)
        })

        // Build the dropdown options
        const combinedCategories: CategoryForDropdown[] = []

        const description = (cat: Category) => {
          const partsCount = cat.parts_count ? `${cat.parts_count.toLocaleString()} parts` : ''
          // I removed the description beacuse it was affecting combobox search
          // const truncatedDescription = cat.description
          //   ? cat.description.substring(0, 40).split(' ').slice(0, -1).join(' ') + '…'
          //   : ''
          // const descriptionText = truncatedDescription ? ` / ${truncatedDescription}` : ''

          // return partsCount || descriptionText ? `${partsCount}${descriptionText}` : undefined
          return partsCount ? `${partsCount}` : undefined
        }

        // Add root categories first (ungrouped)
        rootCategories.forEach((rootCat: Category) => {
          combinedCategories.push({
            value: rootCat.id,
            label: rootCat.name,
            description: description(rootCat),
          })

          // Find all descendants of this root category and add them in sort_order
          const descendants = subcategories
            .filter((cat: Category) => {
              // Find the ultimate root parent
              let parent = categoryMap.get(String(cat.parent_id))
              while (parent && parent.level !== 0) {
                parent = categoryMap.get(String(parent.parent_id))
              }
              return parent?.id === rootCat.id
            })
            .sort((a: Category, b: Category) => (a.sort_order || 0) - (b.sort_order || 0))

          descendants.forEach((cat: Category) => {
            const categoryOption: CategoryForDropdown = {
              value: cat.id,
              label: cat.name,
              group: {
                key: rootCat.name,
                display: (
                  <>
                    <span className="text-gray-800 dark:text-gray-200">{rootCat.sort_order / 10000}.</span>{' '}
                    {rootCat.name}
                  </>
                ),
              },
            }

            // Add indentation for level 2+ categories
            if (cat.level && cat.level >= 2) {
              categoryOption.label = `\u00A0\u00A0 ${cat.name}`
            }

            combinedCategories.push(categoryOption)
          })
        })

        setCategoriesForDropdown(combinedCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Set a new timeout
    searchTimeout.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams()
        if (newQuery) params.append('q', newQuery)
        if (category) params.append('category', category)

        router.replace(`/?${params.toString()}`)
      })
    }, 300)
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Clear any pending timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    handleSearch()
  }

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value
    setCategory(newCategory)

    // Clear any pending timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Automatically trigger search when category changes
    startTransition(() => {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (newCategory) params.append('category', newCategory)

      router.replace(`/?${params.toString()}`)
    })
  }

  // Perform search
  const handleSearch = () => {
    startTransition(() => {
      // If both query and category are empty, reset to default state
      if (!query && !category) {
        router.push('/')
        return
      }

      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (category) params.append('category', category)

      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <div className="w-full" data-testid="search-bar">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col flex-wrap items-end gap-3 md:flex-row">
          <div className="w-full min-w-0 md:flex-1">
            <InputField
              value={query}
              onChange={handleInputChange}
              prefix={<IconMagnifyingGlass />}
              placeholder="Search for part number or name..."
              clearButton
            />
          </div>

          <div className="flex w-full flex-row gap-3 md:w-auto">
            <div className="min-w-72 flex-1">
              <InputField
                type="combobox"
                value={category}
                clearButton
                onChange={handleCategoryChange}
                placeholder="Select a category"
                options={categoriesForDropdown}
              />
              {/* <select
                className="w-full h-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={category}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categoriesForDropdown.map((cat) =>
                  cat.value === 'separator' ? (
                    <option key="separator" disabled>
                      ──── Sub Categories ────
                    </option>
                  ) : (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                      {cat.parts_count > 0 ? ` (${cat.parts_count.toLocaleString()} parts)` : ''}
                    </option>
                  )
                )}
              </select> */}
            </div>
            <button type="submit" className="btn btn-primary min-w-[64px]">
              Go
            </button>
          </div>

          {onImageSearch && (
            <button
              type="button"
              onClick={onImageSearch}
              className="link mt-0 flex w-full items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-5 w-5" fill="currentColor">
                <path d="M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" />
              </svg>
              <span>Image Search</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
