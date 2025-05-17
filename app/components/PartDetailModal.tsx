'use client'

import React, { useEffect, useState } from 'react'
import Dialog from './Dialog'

type PartDetailModalProps = {
  isOpen: boolean
  onClose: () => void
  partId?: string | null
}

export default function PartDetailModal({ isOpen, onClose, partId }: PartDetailModalProps) {
  const [part, setPart] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !partId) {
      setPart(null)
      setError(null)
      return
    }

    const fetchPart = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // This would be replaced with a real API call
        const response = await fetch(`/api/parts/${partId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch part details: ${response.statusText}`)
        }

        const data = await response.json()
        setPart(data)
      } catch (err) {
        console.error('Error fetching part details:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPart()
  }, [isOpen, partId])

  let content

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading part details...</p>
      </div>
    )
  } else if (error) {
    content = (
      <div className="bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md">
        <div className="flex">
          <svg className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Part image placeholder */}
        <div className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-700 h-56 md:h-auto rounded-md flex items-center justify-center">
          {part.image_url ? (
            <img src={part.image_url} alt={part.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-gray-400 dark:text-gray-500">No image</div>
          )}
        </div>

        {/* Part details */}
        <div className="w-full md:w-2/3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{part.name || 'Unknown Part'}</h3>
          <p className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-2">{part.id || 'No ID'}</p>

          {part.description && <p className="mb-4 text-gray-600 dark:text-gray-300">{part.description}</p>}

          {part.category && (
            <div className="mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Category: </span>
              <span className="text-gray-700 dark:text-gray-200">{part.category}</span>
            </div>
          )}

          {/* Other part details would go here */}
        </div>
      </div>
    )
  } else {
    content = (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">No part selected or part not found.</div>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} title={part ? `Part: ${part.name || part.id}` : 'Part Details'} size="xl">
      {content}
    </Dialog>
  )
}
