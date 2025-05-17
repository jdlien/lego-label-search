'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PillContainer from './PillContainer'

// SVG icon for fallback when image fails to load
const BrickIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="currentColor">
    <path d="M19 6V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v1h-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v1H3v14h18V6h-2zM7 5h2v1H7V5zm10 0h2v1h-2V5zm2 9h-6v-2h6v2z" />
  </svg>
)

// Download icon for the download button
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

type Part = {
  id: string
  name: string
  category?: string
  image_url?: string
  // Category hierarchy fields
  grandparent_category?: string
  grandparent_cat_id?: string
  parent_category?: string
  parent_cat_id?: string
  ba_category_name?: string
  ba_cat_id?: string
  category_name?: string
  [key: string]: any
}

type PartCardProps = {
  part: Part
  isSelected?: boolean
  onToggleSelect: (partId: string) => void
  onPartClick: (partId: string) => void
}

export default function PartCard({ part, isSelected = false, onToggleSelect, onPartClick }: PartCardProps) {
  // Strip leading zeros for image filename
  const normalizedPartId = part.id.replace(/^0+/, '')

  // Image paths - with WebP as primary and PNG as fallback
  const webpPath = `/data/images/${normalizedPartId}.webp`
  const pngPath = `/data/images/${normalizedPartId}.png`

  // Start with WebP, fallback to PNG
  const [imageSrc, setImageSrc] = useState<string>(webpPath)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  // Handle image error - try to load PNG if WebP fails
  const handleImageError = () => {
    if (imageSrc === webpPath) {
      // Try PNG version
      setImageSrc(pngPath)
    } else {
      // If PNG also fails
      setImageError(true)
    }
  }

  // Handler for category badge clicks
  const handleCategoryClick = (categoryId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Navigate to homepage with only the category parameter
    // This will clear any existing search query
    router.push(`/?category=${categoryId}`)
  }

  // Create pill objects with text and click handlers
  const categoryPills = [
    part.grandparent_category
      ? {
          text: part.grandparent_category,
          value: part.grandparent_cat_id,
          onClick: part.grandparent_cat_id ? handleCategoryClick(part.grandparent_cat_id) : undefined,
        }
      : null,
    part.parent_category
      ? {
          text: part.parent_category,
          value: part.parent_cat_id,
          onClick: part.parent_cat_id ? handleCategoryClick(part.parent_cat_id) : undefined,
        }
      : null,
    part.ba_category_name
      ? {
          text: part.ba_category_name,
          value: part.ba_cat_id,
          onClick: part.ba_cat_id ? handleCategoryClick(part.ba_cat_id) : undefined,
        }
      : null,
  ].filter(Boolean) as { text: string; value?: string; onClick?: (e: React.MouseEvent) => void }[]

  return (
    <div
      className={`border rounded-md overflow-hidden transition-all ${
        isSelected
          ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-400 dark:border-sky-500'
          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col p-4">
        <div className="flex mb-3">
          {/* Part Image */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onPartClick(part.id)
            }}
            className="mr-3 flex-shrink-0 w-20 h-20 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 flex items-center justify-center p-1 overflow-hidden"
          >
            {!imageError ? (
              <img
                src={imageSrc}
                alt={part.name || part.id}
                className="max-w-full max-h-full object-contain"
                onError={handleImageError}
              />
            ) : (
              <BrickIcon />
            )}
          </a>

          {/* Part Details */}
          <div className="flex-1 min-w-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPartClick(part.id)
              }}
              className="block"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 truncate">
                {part.name || 'Unnamed Part'}
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{part.id}</p>
            </a>

            {part.category_name && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">{part.category_name}</p>
            )}
          </div>
        </div>

        {/* Category Pills */}
        {categoryPills.length > 0 && (
          <div className="my-2 w-full">
            <PillContainer pills={categoryPills} size={21} />
          </div>
        )}

        {/* Selection button and Actions */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          <button
            onClick={() => onToggleSelect(part.id)}
            className={`text-sm px-2 py-1 rounded ${
              isSelected
                ? 'bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200'
                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
          >
            {isSelected ? '✓ Selected' : 'Select'}
          </button>

          <div className="flex space-x-2">
            <button
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Download"
              aria-label="Download"
            >
              <DownloadIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
