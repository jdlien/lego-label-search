'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Dialog from './Dialog'
import { useToastHelpers } from './ToastPop'

type PartData = {
  id: string
  name?: string
  description?: string
  category_id?: string
  grandparent_category?: string
  grandparent_cat_id?: string
  parent_category?: string
  parent_cat_id?: string
  ba_category_name?: string
  ba_cat_id?: string
  part_material?: string
  image_url?: string
  alternatesByType?: Record<
    string,
    {
      heading: string
      description: string
      ids: string[]
    }
  >
}

type PartDetailModalProps = {
  isOpen: boolean
  onClose: () => void
  partId?: string | null
  onPartSearch?: (partId: string) => void
}

// SVG icon for fallback when image fails to load
const BrickPlaceholder = () => (
  <svg viewBox="0 0 24 24" className="h-16 w-16 text-gray-400 dark:text-gray-500" fill="currentColor">
    <circle cx="6" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="18" cy="12" r="2" />
  </svg>
)

// Download icon for the download button
const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

export default function PartDetailModal({ isOpen, onClose, partId, onPartSearch }: PartDetailModalProps) {
  const router = useRouter()
  const [part, setPart] = useState<PartData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imageError, setImageError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [labelExists, setLabelExists] = useState<boolean | null>(null)
  const { success, error: showError, warning } = useToastHelpers()

  useEffect(() => {
    if (!isOpen || !partId) {
      return
    }

    const fetchPart = async () => {
      setIsLoading(true)
      setError(null)
      setImageError(false)

      try {
        const response = await fetch(`/api/parts/${partId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch part details: ${response.statusText}`)
        }

        const data = await response.json()
        setPart(data)

        // Set up image fallback logic
        if (data.image_url) {
          setImageSrc(data.image_url)
        } else {
          // Generate image path similar to PartCard
          const normalizedPartId = partId.replace(/^0+/, '')
          setImageSrc(`/data/images/${normalizedPartId}.webp`)
        }
      } catch (err) {
        console.error('Error fetching part details:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPart()
  }, [isOpen, partId])

  // Clear data after modal closes (with a small delay to allow animation to complete)
  useEffect(() => {
    if (!isOpen && part) {
      const timer = setTimeout(() => {
        setPart(null)
        setError(null)
        setImageSrc('')
        setImageError(false)
        setIsDownloading(false)
        setIsConverting(false)
        setLabelExists(null)
      }, 250) // Slightly longer than the 200ms animation

      return () => clearTimeout(timer)
    }
  }, [isOpen, part])

  // Handle image error - try to load PNG if WebP fails
  const handleImageError = () => {
    if (!partId) return

    const normalizedPartId = partId.replace(/^0+/, '')
    const webpPath = `/data/images/${normalizedPartId}.webp`
    const pngPath = `/data/images/${normalizedPartId}.png`

    if (imageSrc === webpPath) {
      // Try PNG version
      setImageSrc(pngPath)
    } else {
      // If all sources fail, show placeholder
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
    } catch (err) {
      console.error('Error triggering download:', err)
      showError('Could not start the file download.')
    }
  }

  // Handler for label download (12mm)
  const handleLabelDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDownloading || !partId) return

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/download-label?part_num=${partId}`)
      const data = await response.json()

      if (data.success) {
        // Start the download
        await triggerDownload(`/data/labels/${partId}.lbx`, `${partId}.lbx`)
        setLabelExists(true)
      } else {
        setLabelExists(false)
        warning('This part does not have a label available.')
      }
    } catch (err) {
      console.error('Error downloading label:', err)
      showError('There was an error downloading the label.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Handler for 24mm label download
  const handle24mmLabelDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isConverting || !partId) return

    setIsConverting(true)
    try {
      // First, ensure the original label exists
      const downloadResponse = await fetch(`/api/download-label?part_num=${partId}`)
      const downloadData = await downloadResponse.json()

      if (!downloadData.success) {
        setLabelExists(false)
        warning('The original label is not available for conversion.')
        return
      }

      // Add a small delay to ensure the file is fully written to disk
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Now try to convert the label
      const response = await fetch(`/api/convert-label?part_num=${partId}`)
      const data = await response.json()

      if (data.success) {
        // Add a small delay to allow the server to recognize the new file
        await new Promise((resolve) => setTimeout(resolve, 300))
        // Start the download
        await triggerDownload(`/data/labels/${partId}-24mm.lbx`, `${partId}-24mm.lbx`)
      } else {
        // Check if the error message contains a SyntaxWarning about escape sequences
        const isEscapeSequenceWarning = data.message && data.message.includes('SyntaxWarning: invalid escape sequence')

        if (isEscapeSequenceWarning) {
          // Add a small delay here as well if attempting retry on warning
          await new Promise((resolve) => setTimeout(resolve, 300))
          // Try one more time - the script might have executed properly despite the warning
          await triggerDownload(`/data/labels/${partId}-24mm.lbx`, `${partId}-24mm.lbx`)
          warning('There were some warnings during conversion, but your file should be ready.')
        } else {
          showError(data.message || 'There was an error converting the label to 24mm format.')
        }
      }
    } catch (err) {
      console.error('Error converting label:', err)
      showError('There was an error converting the label.')
    } finally {
      setIsConverting(false)
    }
  }

  let content

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading part details...</p>
      </div>
    )
  } else if (error) {
    content = (
      <div className="rounded-md border border-red-400 bg-red-100 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
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
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  } else if (part) {
    content = (
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Part image */}
        <div className="flex h-56 w-full items-center justify-center rounded-md border border-gray-200 bg-white p-4 shadow-md md:h-80 md:w-96">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={part.name || part.id}
              width={320}
              height={320}
              className="max-h-full max-w-full object-contain"
              onError={handleImageError}
            />
          ) : (
            <BrickPlaceholder />
          )}
        </div>

        {/* Part details */}
        <div className="w-full space-y-4 md:w-2/3">
          <div>
            <h3 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">{part.name || 'Unknown Part'}</h3>
            <div className="font-mono text-2xl font-semibold text-gray-500 dark:text-gray-300">{part.id}</div>
          </div>

          {part.description && (
            <div>
              <h4 className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">Rebrickable Category</h4>
              <span className="dark:text-gray-200">
                <span className="text-base">ID:</span>{' '}
                <span className="mr-2 text-base font-bold">{part.category_id}</span>
              </span>
              <span className="rounded-sm bg-purple-300/80 px-2 py-0.5 text-purple-950 dark:bg-purple-800/80 dark:text-purple-200">
                {part.description}
              </span>
            </div>
          )}

          {/* Category hierarchy */}
          {(part.grandparent_category || part.parent_category || part.ba_category_name) && (
            <div>
              <h4 className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">BrickArchitect Category</h4>
              <div className="space-y-1">
                {part.grandparent_category && (
                  <>
                    <button
                      onClick={part.grandparent_cat_id ? handleCategoryClick(part.grandparent_cat_id) : undefined}
                      disabled={!part.grandparent_cat_id}
                      className={`rounded-sm bg-gray-200/80 px-2 py-0.5 text-gray-950 dark:bg-gray-600/80 dark:text-gray-200 ${
                        part.grandparent_cat_id
                          ? 'cursor-pointer transition-colors hover:bg-gray-300/80 dark:hover:bg-gray-500/80'
                          : 'cursor-default'
                      }`}
                    >
                      {part.grandparent_category}
                    </button>
                    <span className="px-1 text-gray-400 dark:text-gray-400">→</span>
                  </>
                )}
                {part.parent_category && (
                  <>
                    <button
                      onClick={part.parent_cat_id ? handleCategoryClick(part.parent_cat_id) : undefined}
                      disabled={!part.parent_cat_id}
                      className={`rounded-sm bg-gray-200/80 px-2 py-0.5 text-gray-950 dark:bg-gray-600/80 dark:text-gray-200 ${
                        part.parent_cat_id
                          ? 'cursor-pointer transition-colors hover:bg-gray-300/80 dark:hover:bg-gray-500/80'
                          : 'cursor-default'
                      }`}
                    >
                      {part.parent_category}
                    </button>
                    <span className="px-1 text-gray-400 dark:text-gray-400">→</span>
                  </>
                )}
                {part.ba_category_name && (
                  <button
                    onClick={part.ba_cat_id ? handleCategoryClick(part.ba_cat_id) : undefined}
                    disabled={!part.ba_cat_id}
                    className={`rounded-sm bg-sky-300/80 px-2 py-0.5 text-sky-950 dark:bg-sky-800/80 dark:text-sky-200 ${
                      part.ba_cat_id
                        ? 'cursor-pointer transition-colors hover:bg-sky-400/80 dark:hover:bg-sky-700/80'
                        : 'cursor-default'
                    }`}
                  >
                    {part.ba_category_name}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Material */}
          {part.part_material && (
            <div>
              <h4 className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">Material</h4>
              <span className="rounded-sm bg-green-300/80 px-2 py-0.5 text-green-950 dark:bg-green-800/80 dark:text-green-200">
                {part.part_material}
              </span>
            </div>
          )}

          {/* Alternative part relationships */}
          {part.alternatesByType && Object.entries(part.alternatesByType).some(([, rel]) => rel.ids.length > 0) && (
            <div>
              <h4 className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">Alternate Parts</h4>
              <div className="space-y-3">
                {Object.entries(part.alternatesByType).map(
                  ([type, rel]) =>
                    rel.ids.length > 0 && (
                      <div key={type}>
                        <h5 className="mb-1 font-medium text-gray-600 dark:text-gray-400">{rel.heading}</h5>
                        <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">{rel.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {rel.ids.map((altId: string) => (
                            <button
                              key={altId}
                              onClick={() => onPartSearch?.(altId)}
                              className="cursor-pointer rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              {altId}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Label download buttons */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
            <h4 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">Download Labels</h4>
            <div className="flex items-center justify-start">
              {labelExists === false ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No label available</div>
              ) : (
                <div className="flex space-x-6">
                  <button
                    className="link flex items-center space-x-2 text-base"
                    onClick={handleLabelDownload}
                    disabled={isDownloading}
                    title="Download 12mm Label"
                    aria-label="Download 12mm Label"
                  >
                    <DownloadIcon />
                    <span>{isDownloading ? 'Downloading...' : 'LBX 12mm'}</span>
                  </button>
                  <button
                    className="link flex items-center space-x-2 text-base"
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
      </div>
    )
  } else {
    content = (
      <div className="py-6 text-center text-gray-500 dark:text-gray-400">No part selected or part not found.</div>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} title={part ? `Part ${part.id} Details` : 'Part Details'} size="4xl">
      {content}
    </Dialog>
  )
}
