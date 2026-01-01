'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Dialog from './Dialog'
import ExternalLinks from './ExternalLinks'
import { BrickPlaceholder } from './icons'
import CategoryBreadcrumb from './CategoryBreadcrumb'
import LabelDownloadButtons from './LabelDownloadButtons'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'
import { usePWANavigation } from '../hooks/usePWANavigation'
import { useLabelDownload } from '../hooks/useLabelDownload'

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
  img_file?: string
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

export default function PartDetailModal({ isOpen, onClose, partId, onPartSearch }: PartDetailModalProps) {
  const [part, setPart] = useState<PartData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imageError, setImageError] = useState(false)
  const [navigatingToPartId, setNavigatingToPartId] = useState<string | null>(null)

  // Use extracted hooks
  const { navigateToCategory, navigateToSearch, isPWA } = usePWANavigation({
    onBeforeNavigate: onClose,
  })
  const { resetLabelExists } = useLabelDownload(partId)

  // Fetch part details when modal opens
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

        // Set up image using img_file field
        if (data.img_file) {
          setImageSrc(`/data/images/${data.img_file}`)
          setImageError(false)
        } else {
          setImageError(true)
          setImageSrc('')
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
        setNavigatingToPartId(null)
        resetLabelExists()
      }, 250) // Slightly longer than the 200ms animation

      return () => clearTimeout(timer)
    }
  }, [isOpen, part, resetLabelExists])

  // Handle image error
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  // Handler for alternate part clicks
  const handleAlternatePartClick = useCallback(
    (altId: string) => {
      // Prevent multiple clicks
      if (navigatingToPartId === altId) return

      setNavigatingToPartId(altId)
      onClose()

      if (isPWA) {
        setTimeout(() => {
          if (onPartSearch) {
            onPartSearch(altId)
          } else {
            navigateToSearch(altId)
          }
          setNavigatingToPartId(null)
        }, 150)
      } else {
        setTimeout(() => {
          onPartSearch?.(altId)
          setNavigatingToPartId(null)
        }, 100)
      }
    },
    [navigatingToPartId, onClose, isPWA, onPartSearch, navigateToSearch]
  )

  // Build content based on state
  let content: React.ReactNode

  if (isLoading) {
    content = <LoadingSpinner size="md" text="Loading part details..." />
  } else if (error) {
    content = <ErrorAlert message={error} />
  } else if (part) {
    content = (
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Part image */}
        <div className="relative flex h-56 w-full items-center justify-center rounded-md border border-gray-200 bg-white p-4 shadow-md md:h-80 md:w-96">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={part.name || part.id}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-contain"
              onError={handleImageError}
              priority={true}
            />
          ) : (
            <BrickPlaceholder className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {/* Part details */}
        <div className="w-full space-y-4 md:w-2/3">
          <div>
            <h3 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {part.name || 'Unknown Part'}
            </h3>
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
              <CategoryBreadcrumb
                categories={[
                  { id: part.grandparent_cat_id, name: part.grandparent_category, variant: 'gray' },
                  { id: part.parent_cat_id, name: part.parent_category, variant: 'gray' },
                  { id: part.ba_cat_id, name: part.ba_category_name, variant: 'sky' },
                ]}
                onNavigate={navigateToCategory}
              />
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
                              onClick={() => handleAlternatePartClick(altId)}
                              disabled={navigatingToPartId === altId}
                              className={`cursor-pointer rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                                navigatingToPartId === altId ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                            >
                              {navigatingToPartId === altId ? 'Loading...' : altId}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
            <ExternalLinks partNum={part.id} />
          </div>

          {/* Label download buttons */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
            <h4 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">Labels</h4>
            <LabelDownloadButtons partId={part.id} layout="horizontal" />
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
