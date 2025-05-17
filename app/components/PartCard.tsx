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
  const [isDownloading, setIsDownloading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [labelExists, setLabelExists] = useState<boolean | null>(null)
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

  // Unified download trigger function
  const triggerDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error triggering download:', error)
      alert('Download failed: Could not start the file download.')
    }
  }

  // Handler for label download (12mm)
  const handleLabelDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDownloading) return

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/download-label?part_num=${part.id}`)
      const data = await response.json()

      if (data.success) {
        // Start the download
        await triggerDownload(`/data/labels/${part.id}.lbx`, `${part.id}.lbx`)
        setLabelExists(true)
      } else {
        setLabelExists(false)
        alert('Label not available: This part does not have a label available.')
      }
    } catch (error) {
      console.error('Error downloading label:', error)
      alert('Download failed: There was an error downloading the label.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Handler for 24mm label download
  const handle24mmLabelDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isConverting) return

    setIsConverting(true)
    try {
      // First, ensure the original label exists
      const downloadResponse = await fetch(`/api/download-label?part_num=${part.id}`)
      const downloadData = await downloadResponse.json()

      if (!downloadData.success) {
        setLabelExists(false)
        alert('Label not available: The original label is not available for conversion.')
        return
      }

      // Add a small delay to ensure the file is fully written to disk
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Now try to convert the label
      const response = await fetch(`/api/convert-label?part_num=${part.id}`)
      const data = await response.json()

      if (data.success) {
        // Add a small delay to allow the server to recognize the new file
        await new Promise((resolve) => setTimeout(resolve, 300))
        // Start the download
        await triggerDownload(`/data/labels/${part.id}-24mm.lbx`, `${part.id}-24mm.lbx`)
      } else {
        // Check if the error message contains a SyntaxWarning about escape sequences
        const isEscapeSequenceWarning = data.message && data.message.includes('SyntaxWarning: invalid escape sequence')

        if (isEscapeSequenceWarning) {
          // Add a small delay here as well if attempting retry on warning
          await new Promise((resolve) => setTimeout(resolve, 300))
          // Try one more time - the script might have executed properly despite the warning
          await triggerDownload(`/data/labels/${part.id}-24mm.lbx`, `${part.id}-24mm.lbx`)
          alert(
            'Conversion completed with warnings: There were some warnings during conversion, but your file should be ready.'
          )
        } else {
          alert(`Conversion failed: ${data.message || 'There was an error converting the label to 24mm format.'}`)
        }
      }
    } catch (error) {
      console.error('Error converting label:', error)
      alert('Conversion failed: There was an error converting the label.')
    } finally {
      setIsConverting(false)
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
    <div className="border rounded-md overflow-hidden transition-all bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-md">
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
        <div className="flex justify-center items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          {labelExists === false ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No label available</div>
          ) : (
            <div className="flex space-x-2">
              <button
                className="link text-sm flex items-center space-x-1"
                onClick={handleLabelDownload}
                disabled={isDownloading}
                title="Download 12mm Label"
                aria-label="Download 12mm Label"
              >
                <DownloadIcon />
                <span>{isDownloading ? 'Downloading...' : 'LBX 12mm'}</span>
              </button>
              <button
                className="link text-sm flex items-center space-x-1"
                onClick={handle24mmLabelDownload}
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
