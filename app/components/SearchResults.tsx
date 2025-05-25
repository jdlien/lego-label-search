'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PartDetailModal from './PartDetailModal'
import PartCard from './PartCard'

// We'll need to create this component next
// import PartCard from './PartCard'

type Part = {
  id: string
  name: string
  [key: string]: string | number | boolean | null | undefined
}

type SearchResultsProps = {
  results?: Part[]
  totalResults?: number
  subcategoryCount?: number
  onPartClick?: (partId: string) => void
  onPartSearch?: (partId: string) => void
}

export default function SearchResults({
  results = [],
  totalResults = 0,
  subcategoryCount = 0,
  onPartClick,
  onPartSearch,
}: SearchResultsProps) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePartClick = (partId: string) => {
    // If parent provided a click handler, use that
    if (onPartClick) {
      onPartClick(partId)
    } else {
      // Otherwise use local state
      setSelectedPartId(partId)
      setIsModalOpen(true)
    }
  }

  // If no results, show a message and a reset button if applicable
  if (results.length === 0) {
    return (
      <div className="py-10 text-center">
        <h3 className="text-md mb-4 font-medium text-gray-500 dark:text-gray-400">No results found</h3>
        {(searchParams.get('category') || searchParams.get('q')) && (
          <button onClick={() => router.push('/')} className="link text-sm">
            Reset Search
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mt-2 mb-4">
        <div className="flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
          {subcategoryCount > 0 && (
            <p className="text-gray-600 dark:text-gray-300">
              &nbsp;across {subcategoryCount + 1} categor{subcategoryCount === 0 ? 'y' : 'ies'}
            </p>
          )}
        </div>
        <div className="mt-0 mb-2 flex items-center justify-center">
          {searchParams.get('category') && (
            <button
              className="link ml-2 text-sm"
              onClick={() => {
                // Remove only the category param, preserve q if present
                const params = new URLSearchParams()
                if (searchParams.get('q')) params.append('q', searchParams.get('q')!)
                router.push(`/?${params.toString()}`)
              }}
            >
              Search All Categories
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {results.map((part) => (
          <PartCard key={part.id} part={part} onPartClick={handlePartClick} />
        ))}
      </div>

      {/* Part Detail Modal - only render if we're not using the parent's modal */}
      {!onPartClick && (
        <PartDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          partId={selectedPartId}
          onPartSearch={onPartSearch}
        />
      )}
    </div>
  )
}
