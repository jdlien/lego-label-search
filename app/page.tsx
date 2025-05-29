'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchBar from './components/SearchBar'
import ImageSearchModal from './components/ImageSearchModal'
import SearchResults from './components/SearchResults'
import Pagination from './components/Pagination'
import PageSizeSelector from './components/PageSizeSelector'

type Part = {
  id: string
  name: string
  img_file?: string
  [key: string]: string | number | boolean | null | undefined
}

type SearchResponse = {
  items: Array<{
    id: string
    name: string
    img_url?: string
    category?: string
    score?: number
    external_sites?: Array<{ name: string; url: string }>
  }>
}

type ApiSearchResponse = {
  results: Part[]
  total: number
  returned: number
  categories: string[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // State management
  const [isLoading, setIsLoading] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Part[]>([])
  const [totalResultCount, setTotalResultCount] = useState(0)
  const [pagination, setPagination] = useState<ApiSearchResponse['pagination'] | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false)

  // Keep track of the last known pagination state to prevent flickering
  const [stablePagination, setStablePagination] = useState<ApiSearchResponse['pagination'] | null>(null)
  // Track the last query/category to detect when search params change (not just page)
  const [lastSearchKey, setLastSearchKey] = useState('')

  // Load search results when query parameters change
  useEffect(() => {
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const part = searchParams.get('part')

    // If we have a part parameter but no search query, convert part to search
    if (part && !q && !category) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('q', part)
      // Keep the part parameter so modal opens
      router.replace(`/?${params.toString()}`, { scroll: false })
      return
    }

    if (!q && !category) {
      setHasSearched(false)
      setResults([])
      setTotalResultCount(0)
      setPagination(null)
      setStablePagination(null)
      return
    }

    // Check if this is a new search (not just a page change)
    const currentSearchKey = `${q || ''}-${category || ''}`
    const isNewSearch = currentSearchKey !== lastSearchKey

    if (isNewSearch) {
      setLastSearchKey(currentSearchKey)
      // Reset stable pagination for new searches
      setStablePagination(null)
      // Clear results immediately for new searches
      setResults([])
      setTotalResultCount(0)
    }

    setIsLoading(true)
    setHasSearched(true)
    setError(null)

    // Delay showing spinner by a few ms to prevent flashing on quick searches
    const spinnerTimeout = setTimeout(() => {
      setShowSpinner(true)
    }, 200)

    const fetchResults = async () => {
      try {
        const queryParams = new URLSearchParams()
        if (q) queryParams.append('q', q)
        if (category) queryParams.append('category', category)
        if (page) queryParams.append('page', page)
        if (limit) queryParams.append('limit', limit)

        const response = await fetch(`/api/search?${queryParams.toString()}`)
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }
        const data: ApiSearchResponse = await response.json()

        // Store the results and pagination info
        setResults(data.results || [])
        setTotalResultCount(data.total || 0)
        setPagination(data.pagination || null)

        // Update stable pagination if we have valid pagination data
        if (data.pagination && data.pagination.totalPages > 1) {
          setStablePagination(data.pagination)
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch results'
        setError(errorMessage)
      } finally {
        clearTimeout(spinnerTimeout)
        setIsLoading(false)
        setShowSpinner(false)
      }
    }

    fetchResults()
  }, [searchParams, router, lastSearchKey])

  // Handler functions
  const handleImageSearchModalOpen = () => {
    setIsImageSearchModalOpen(true)
  }

  const handleImageSearchModalClose = () => {
    setIsImageSearchModalOpen(false)
  }

  const handleImageSubmit = (searchResults: SearchResponse, options?: { keepModalOpen?: boolean }) => {
    console.log('Image search results:', searchResults)
    if (!options?.keepModalOpen) {
      setIsImageSearchModalOpen(false)
    }

    // If we have search results, we can process them here
    // For example, display them or perform additional searches
    if (searchResults?.items && searchResults.items.length > 0) {
      // You could set these as results or navigate to a search for the first result
      console.log(`Found ${searchResults.items.length} items from image search`)

      // Optional: Automatically search for the first result's part ID
      const firstResult = searchResults.items[0]
      if (firstResult?.id) {
        const params = new URLSearchParams()
        params.append('q', firstResult.id)
        router.push(`/?${params.toString()}`)
      }
    }
  }

  const handlePartSearch = (partId: string) => {
    // Navigate to perform a search for the alternate part ID
    const params = new URLSearchParams()
    params.append('q', partId)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="">
      <div className="container mx-auto max-w-screen-2xl px-4 pt-4 pb-3">
        <div className="flex flex-col items-stretch">
          {/* SearchBar component */}
          <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
            <SearchBar onImageSearch={handleImageSearchModalOpen} />
          </div>

          {/* Loading state - only show spinner if we don't have existing results to show */}
          {showSpinner && results.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-sky-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="my-4 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
              <div className="flex">
                <svg className="mr-2 h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-bold">Search failed!</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Top pagination - show if we have stable pagination state */}
          {hasSearched && stablePagination && stablePagination.totalPages > 1 && (
            <div className="mb-2 flex flex-col items-center gap-4 space-y-1 sm:space-y-0">
              <Pagination
                currentPage={pagination?.page || stablePagination.page}
                totalPages={stablePagination.totalPages}
                hasNext={pagination?.hasNext || stablePagination.hasNext}
                hasPrev={pagination?.hasPrev || stablePagination.hasPrev}
              />
            </div>
          )}

          {/* Results - Keep visible during loading for smooth transitions */}
          {hasSearched && results.length > 0 && (
            <div className="relative">
              {/* Subtle loading overlay for pagination changes */}
              {isLoading && !showSpinner && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-20">
                  <div className="rounded-full bg-white/90 p-3 shadow-lg dark:bg-gray-800/90">
                    <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-sky-500"></div>
                  </div>
                </div>
              )}
              <div className={isLoading ? 'opacity-60 transition-opacity duration-200' : 'transition-opacity duration-200'}>
                <SearchResults
                  results={results}
                  totalResults={totalResultCount}
                  subcategoryCount={results.length > 0 ? 0 : 0}
                  onPartSearch={handlePartSearch}
                  pagination={pagination}
                  data-testid="search-results"
                />
              </div>
            </div>
          )}
          
          {/* Show empty state only when not loading and no results */}
          {!isLoading && hasSearched && results.length === 0 && !error && (
            <SearchResults
              results={[]}
              totalResults={0}
              subcategoryCount={0}
              onPartSearch={handlePartSearch}
              pagination={null}
              data-testid="search-results-empty"
            />
          )}

          {/* Bottom pagination - show if we have stable pagination state */}
          {hasSearched && stablePagination && stablePagination.totalPages > 1 && (
            <div className="mt-6 mb-2 flex flex-col items-center gap-4 space-y-1 sm:space-y-0">
              <Pagination
                currentPage={pagination?.page || stablePagination.page}
                totalPages={stablePagination.totalPages}
                hasNext={pagination?.hasNext || stablePagination.hasNext}
                hasPrev={pagination?.hasPrev || stablePagination.hasPrev}
              />
              <PageSizeSelector className="" />
            </div>
          )}

          {/* Initial state - welcome message */}
          {!isLoading && !error && !hasSearched && (
            <div className="pt-4 pb-32 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Enter a search term, select a category,
                <br />
                or&nbsp;
                <button onClick={handleImageSearchModalOpen} className="link">
                  search using an image
                </button>
              </p>
            </div>
          )}

          {/* Modals */}
          <ImageSearchModal
            isOpen={isImageSearchModalOpen}
            onClose={handleImageSearchModalClose}
            onImageSubmit={handleImageSubmit}
          />
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-screen-2xl px-4 pt-4 pb-3">
        <div className="flex flex-col items-stretch">
          <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
            <div className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-sky-500"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  )
}
