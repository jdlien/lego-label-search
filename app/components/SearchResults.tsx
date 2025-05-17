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
  [key: string]: any
}

type SearchResultsProps = {
  results?: Part[]
  totalResults?: number
  subcategoryCount?: number
  onPartClick?: (partId: string) => void
}

export default function SearchResults({
  results = [],
  totalResults = 0,
  subcategoryCount = 0,
  onPartClick,
}: SearchResultsProps) {
  const [selectedParts, setSelectedParts] = useState<Record<string, boolean>>({})
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Handler functions
  const handleToggleSelect = (partId: string) => {
    setSelectedParts((prev) => {
      const newSelected = { ...prev }
      if (newSelected[partId]) {
        delete newSelected[partId]
      } else {
        newSelected[partId] = true
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    const newSelected: Record<string, boolean> = {}
    results.forEach((part) => {
      newSelected[part.id] = true
    })
    setSelectedParts(newSelected)
  }

  const handleClearSelection = () => {
    setSelectedParts({})
  }

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

  const closeModal = () => {
    setIsModalOpen(false)
  }

  // If no results, show a message and a reset button if applicable
  if (results.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-md font-medium text-gray-500 dark:text-gray-400 mb-4">No results found</h3>
        {(searchParams.get('category') || searchParams.get('q')) && (
          <button onClick={() => router.push('/')} className="text-sm link">
            Reset Search
          </button>
        )}
      </div>
    )
  }

  const selectedCount = Object.keys(selectedParts).length

  return (
    <div>
      <div className="mt-2 mb-4">
        <div className="flex justify-center items-center">
          <p className="text-gray-600 dark:text-gray-300">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
          {subcategoryCount > 0 && (
            <p className="text-gray-600 dark:text-gray-300">
              &nbsp;across {subcategoryCount + 1} categor{subcategoryCount === 0 ? 'y' : 'ies'}
            </p>
          )}
        </div>
        <div className="flex justify-center items-center mt-0 mb-2">
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
        {/* Display selected count and actions if any parts are selected */}
        {selectedCount > 0 && (
          <div className="flex justify-center items-center gap-4 mt-2 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedCount} part{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button className="link text-sm" onClick={handleClearSelection}>
              Clear Selection
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            isSelected={!!selectedParts[part.id]}
            onToggleSelect={handleToggleSelect}
            onPartClick={handlePartClick}
          />
        ))}
      </div>

      {/* Part Detail Modal - only render if we're not using the parent's modal */}
      {!onPartClick && <PartDetailModal isOpen={isModalOpen} onClose={closeModal} partId={selectedPartId} />}
    </div>
  )
}
