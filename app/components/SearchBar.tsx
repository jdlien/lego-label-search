'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import InputField from './InputField'
import { IconMagnifyingGlass } from './InputField/InputIcons'

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
  const [categoriesForDropdown, setCategoriesForDropdown] = useState<any[]>([])
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Update state when URL parameters change
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const urlCategory = searchParams.get('category') || ''

    setQuery(urlQuery)
    setCategory(urlCategory)
  }, [searchParams])

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()

        // Split categories into parent and child categories
        const parentCategories = data.categories
          .filter((cat: any) => !cat.parent_id || cat.parent_id === '')
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            isParent: true,
            parts_count: cat.parts_count || 0,
          }))

        const childCategories = data.categories
          .filter((cat: any) => cat.parent_id && cat.parent_id !== '')
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            isParent: false,
            parts_count: cat.parts_count || 0,
          }))

        // Sort both groups using natural sort
        const naturalSort = (a: any, b: any) => {
          const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
          return collator.compare(a.name, b.name)
        }

        parentCategories.sort(naturalSort)
        childCategories.sort(naturalSort)

        // Add separator between parent and child categories if we have both
        let combinedCategories = [...parentCategories]

        if (parentCategories.length > 0 && childCategories.length > 0) {
          combinedCategories.push({
            id: 'separator',
            name: '── Sub Categories ──',
            isParent: false,
            disabled: true,
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
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
          <div className="w-full md:flex-1 min-w-0">
            <InputField
              value={query}
              onChange={handleInputChange}
              placeholder="Search for part number or name..."
              clearButton
            />
          </div>

          <div className="flex flex-row gap-3 w-full md:w-auto">
            <div className="flex-1 min-w-0">
              <InputField
                type="select"
                value={category}
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
                  cat.id === 'separator' ? (
                    <option key="separator" disabled>
                      ──── Sub Categories ────
                    </option>
                  ) : (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
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
              className="link w-full flex items-center justify-center gap-2 mt-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5" fill="currentColor">
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
