'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import PillContainer from './PillContainer'
import { BrickPlaceholder, DownloadIcon } from './icons'
import { useLabelDownload } from '../hooks/useLabelDownload'

type Part = {
  id: string
  name: string
  category?: string
  image_url?: string
  img_file?: string
  // Category hierarchy fields
  grandparent_category?: string
  grandparent_cat_id?: string
  parent_category?: string
  parent_cat_id?: string
  ba_category_name?: string
  ba_cat_id?: string
  category_name?: string
  example_design_id?: string
  [key: string]: string | number | boolean | undefined | null
}

type PartCardProps = {
  part: Part
  onPartClick: (partId: string) => void
  priority?: boolean
}

export default function PartCard({ part, onPartClick, priority = false }: PartCardProps) {
  // Use the img_file field from database - much simpler!
  const imagePath = part.img_file ? `/data/images/${part.img_file}` : null

  // State for image loading
  const [imageError, setImageError] = useState(!imagePath)
  const router = useRouter()

  // Use the shared download hook for label downloads
  const { download12mm, download24mm, isDownloading, isConverting, labelExists } = useLabelDownload(part.id)

  // Handle image error - no fallback needed since we have the exact filename
  const handleImageError = () => {
    setImageError(true)
  }

  // Handler for category badge clicks
  const handleCategoryClick = (categoryId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Navigate to homepage with only the category parameter
    // This will clear any existing search query by not including 'q' parameter
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
      className="space-between flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white p-2 shadow-sm transition-all dark:border-gray-600 dark:bg-gray-700"
      data-testid="part-card"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="mb-2 flex flex-wrap">
          {/* Part Image */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onPartClick(part.id)
            }}
            className="mr-3 flex h-32 w-40 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm border border-gray-200 bg-white p-1 dark:border-gray-600"
          >
            {!imageError && imagePath ? (
              <Image
                src={imagePath}
                alt={part.name || part.id}
                width={160}
                height={128}
                className="max-h-full max-w-full object-contain"
                onError={handleImageError}
                priority={priority}
              />
            ) : (
              <BrickPlaceholder />
            )}
          </a>

          {/* Part Details */}
          <div className="min-w-0 flex-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPartClick(part.id)
              }}
              className="link font-mono text-2xl font-semibold"
            >
              {part.id}
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPartClick(part.id)
              }}
              className="block"
            >
              <h3 className="text-lg leading-tight text-gray-900 hover:text-sky-600 dark:text-white dark:hover:text-sky-400">
                {part.name || 'Unnamed Part'}
              </h3>
            </a>
            {part.category_name && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{part.category_name}</p>
            )}
          </div>

          {/* Category Pills */}
          <div className="mt-4 w-full space-y-2">
            {categoryPills.length > 0 && <PillContainer pills={categoryPills} size={21} />}
          </div>
        </div>

        {/* Label download buttons */}
        <div className="-mx-2 mt-2 flex items-center justify-center border-t border-gray-100 pt-2 dark:border-gray-600">
          {labelExists === false ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No label available</div>
          ) : (
            <div className="flex space-x-8">
              <button
                className="link flex items-center space-x-1 text-sm"
                onClick={download12mm}
                disabled={isDownloading}
                title="Download 12mm Label"
                aria-label="Download 12mm Label"
              >
                <DownloadIcon />
                <span>{isDownloading ? 'Downloading...' : 'LBX 12mm'}</span>
              </button>
              <button
                className="link flex items-center space-x-1 text-sm"
                onClick={download24mm}
                disabled={isConverting}
                title="Download 24mm Label"
                aria-label="Download 24mm Label"
              >
                <DownloadIcon />
                <span>{isConverting ? 'Converting...' : 'LBX 24mm'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
