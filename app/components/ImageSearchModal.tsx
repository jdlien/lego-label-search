'use client'

import React, { useState } from 'react'
import Dialog from './Dialog'

type ImageSearchModalProps = {
  isOpen: boolean
  onClose: () => void
  onImageSubmit?: (imageData: string | File, options?: { keepModalOpen?: boolean }) => void
}

export default function ImageSearchModal({ isOpen, onClose, onImageSubmit }: ImageSearchModalProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = () => {
    // This would normally process the image data
    if (onImageSubmit) {
      onImageSubmit('placeholder-data', { keepModalOpen: false })
    }
  }

  const actionButtons = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Cancel
      </button>
      <button onClick={handleSubmit} disabled={isUploading} className="btn btn-primary">
        {isUploading ? 'Processing...' : 'Search'}
      </button>
    </>
  )

  return (
    <Dialog open={isOpen} onClose={onClose} title="Image Search" size="lg" actions={actionButtons}>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        You can upload an image or take a photo to search for LEGO parts.
      </p>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Drag and drop an image here, or click to select a file
        </p>
      </div>
    </Dialog>
  )
}
