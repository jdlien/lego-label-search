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
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Part[]>([])
  const [totalResultCount, setTotalResultCount] = useState(0)
  const [pagination, setPagination] = useState<ApiSearchResponse['pagination'] | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false)
  const [directPartId, setDirectPartId] = useState<string | null>(null)

  // Load search results when query parameters change
  useEffect(() => {
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const part = searchParams.get('part')

    // If we have a part parameter, search for that specific part
    if (part && !q) {
      setDirectPartId(part)
      // Convert to a search query
      const params = new URLSearchParams(searchParams.toString())
      params.delete('part')
      params.set('q', part)
      router.replace(`/?${params.toString()}`)
      return
    }

    if (!q && !category) {
      setHasSearched(false)
      setResults([])
      setTotalResultCount(0)
      setPagination(null)
      setDirectPartId(null)
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setError(null)

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
        
        // Clear directPartId after results are loaded
        if (directPartId) {
          setTimeout(() => setDirectPartId(null), 100)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch results'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [searchParams, directPartId, router])

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

          {/* Loading state */}
          {isLoading && (
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

          {/* Results */}
          {!isLoading && !error && hasSearched && (
            <>
              {/* Top pagination and page size selector */}
              {pagination && (
                <div className="mb-2 flex flex-col items-center gap-4 space-y-1 sm:space-y-0">
                  {pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      hasNext={pagination.hasNext}
                      hasPrev={pagination.hasPrev}
                    />
                  )}
                  {/* <PageSizeSelector className="" /> */}
                </div>
              )}

              <SearchResults
                results={results}
                totalResults={totalResultCount}
                subcategoryCount={results.length > 0 ? 0 : 0}
                onPartSearch={handlePartSearch}
                pagination={pagination}
                autoOpenPartId={directPartId}
              />

              {/* Bottom pagination */}
              {pagination && (
                <div className="mt-6 mb-2 flex flex-col items-center gap-4 space-y-1 sm:space-y-0">
                  {pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      hasNext={pagination.hasNext}
                      hasPrev={pagination.hasPrev}
                    />
                  )}
                  <PageSizeSelector className="" />
                </div>
              )}
            </>
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
