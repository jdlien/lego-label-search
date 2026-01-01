'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Dialog from './Dialog'
import LoadingSpinner from './LoadingSpinner'
import { useCamera } from '../hooks/useCamera'
import { useHeicConverter } from '../hooks/useHeicConverter'

type ImageSearchModalProps = {
  isOpen: boolean
  onClose: () => void
  onImageSubmit?: (searchResults: SearchResponse, options?: { keepModalOpen?: boolean }) => void
}

type SearchResult = {
  id: string
  name: string
  img_url?: string
  category?: string
  score?: number
  external_sites?: Array<{ name: string; url: string }>
}

type SearchResponse = {
  items: SearchResult[]
}

export default function ImageSearchModal({ isOpen, onClose, onImageSubmit }: ImageSearchModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [apiStatus, setApiStatus] = useState({ isChecking: false, isAvailable: true })
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use extracted hooks
  const {
    videoRef,
    canvasRef,
    isStreamActive,
    cameraError,
    startCamera,
    stopCamera,
    takePicture,
    clearError: clearCameraError,
  } = useCamera({ facingMode: 'environment' })

  const { isConverting, processFile } = useHeicConverter({
    onError: (errorMessage) => setError(errorMessage),
  })

  // Check API health
  const checkApiHealth = useCallback(async () => {
    setApiStatus({ isChecking: true, isAvailable: false })
    try {
      const healthResponse = await fetch('/api/health', {
        method: 'GET',
        headers: { accept: 'application/json' },
      })

      if (!healthResponse.ok) {
        throw new Error(`API service is unavailable: ${healthResponse.status} ${healthResponse.statusText}`)
      }

      const healthData = await healthResponse.json()
      if (!healthData.success) {
        throw new Error('API service is currently experiencing issues. Please try again later.')
      }

      setApiStatus({ isChecking: false, isAvailable: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('API Health check failed:', errorMessage)
      setApiStatus({ isChecking: false, isAvailable: false })
    }
  }, [])

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      checkApiHealth()
      setSelectedImage(null)
      setSearchResults(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(null)
      clearCameraError()
      setIsLoading(false)
      setShowCamera(true)
    } else {
      stopCamera()
      setShowCamera(false)
      setSelectedImage(null)
      setSearchResults(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(null)
      clearCameraError()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Start/stop camera based on showCamera state
  useEffect(() => {
    if (isOpen && showCamera) {
      startCamera()
    } else if (isOpen && !showCamera) {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showCamera])

  // Handle file selection
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        stopCamera()
        setShowCamera(false)
        setError(null)

        try {
          const processedFile = await processFile(file)
          setSelectedImage(processedFile)
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          setPreviewUrl(URL.createObjectURL(processedFile))
        } catch (err) {
          console.error('Error processing file:', err)
          setError(err instanceof Error ? err.message : 'Failed to process the selected image.')
        }
      }
      event.target.value = ''
    },
    [stopCamera, processFile, previewUrl]
  )

  // Handle taking a picture from camera
  const handleTakePicture = useCallback(() => {
    const file = takePicture()
    if (file) {
      stopCamera()
      setShowCamera(false)
      setSelectedImage(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }, [takePicture, stopCamera, previewUrl])

  // Switch to file upload
  const switchToUpload = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 10)
    }
  }, [])

  // Clear selection and restart camera
  const clearSelectionAndRestartCamera = useCallback(() => {
    stopCamera()
    setSelectedImage(null)
    setSearchResults(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    clearCameraError()

    setTimeout(() => {
      setShowCamera(true)
    }, 100)
  }, [stopCamera, previewUrl, clearCameraError])

  // Submit image for search
  const handleImageSubmit = useCallback(async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first.')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('query_image', selectedImage)

      const response = await fetch('/api/predict/parts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorBodyText = await response.text()
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorBodyText)
          if (errorData?.detail) {
            if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && errorData.detail[0].msg) {
              errorMessage = errorData.detail[0].msg
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail
            }
          }
        } catch {
          if (errorBodyText && errorBodyText.length < 500) {
            errorMessage += ` - ${errorBodyText}`
          }
        }
        throw new Error(errorMessage)
      }

      const results = await response.json()
      setSearchResults(results)

      if (onImageSubmit) {
        onImageSubmit(results, { keepModalOpen: true })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Image submission error:', err)
      setError(errorMessage || 'Failed to submit image. Check console for more details.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedImage, onImageSubmit])

  // Search icon component
  const SearchIcon = () => (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )

  // Render search results view
  const renderResultsView = () => {
    if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
      return (
        <div className="flex flex-col justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center justify-center">
            <svg className="mr-2 h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200">No matching items found</span>
          </div>
          <button onClick={clearSelectionAndRestartCamera} className="btn mx-auto mt-3 w-full max-w-sm py-2 font-medium">
            Try Again
          </button>
        </div>
      )
    }

    return (
      <div className="">
        <p className="mb-2 text-center text-base text-gray-600 dark:text-gray-400">
          {searchResults.items.length} Item{searchResults.items.length !== 1 ? 's' : ''} Found
        </p>

        {searchResults.items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[100px_1fr]">
              {item.img_url && (
                <div className="flex justify-center rounded bg-white p-1">
                  <Image
                    src={item.img_url}
                    alt={item.name}
                    width={100}
                    height={100}
                    className="h-auto w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>

                <div className="mt-1 flex items-center gap-1">
                  <span className="text-md font-bold text-gray-700 dark:text-gray-300">Part</span>
                  <a href={`?q=${item.id}`} className="link flex items-center gap-1">
                    <SearchIcon />
                    <span className="font-mono text-lg">{item.id}</span>
                  </a>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.category && (
                    <span className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                      {item.category}
                    </span>
                  )}

                  {item.score && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>{Math.round(item.score * 100)}%</strong> Match
                    </span>
                  )}

                  {item.external_sites && item.external_sites.length > 0 && (
                    <>
                      {item.external_sites.map((site, siteIndex) => (
                        <a
                          key={siteIndex}
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link text-sm"
                        >
                          {site.name === 'bricklink' ? 'BrickLink' : site.name}
                        </a>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-center">
          <button onClick={clearSelectionAndRestartCamera} className="btn mx-auto mt-4 w-full max-w-sm py-2 font-medium">
            Search New Image
          </button>
        </div>
      </div>
    )
  }

  const modalTitle = searchResults ? 'Search Results' : 'Image Search for One Part'

  return (
    <Dialog open={isOpen} onClose={onClose} title={modalTitle} size="3xl">
      <div className="">
        {/* API unavailable alert */}
        {!apiStatus.isAvailable && !apiStatus.isChecking && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="text-center">
              <p className="font-medium text-red-800 dark:text-red-200">
                The image search service is currently unavailable
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                Please try again later or contact the site owner if the issue persists.
              </p>
              <button onClick={checkApiHealth} className="btn mx-auto mt-2 max-w-sm">
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* General error alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Camera error alert */}
        {cameraError && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-orange-800 dark:text-orange-200">{cameraError}</span>
            </div>
            <button onClick={startCamera} className="btn mt-3 w-full py-2 font-medium">
              Retry Camera
            </button>
          </div>
        )}

        {/* Main content */}
        {isLoading ? (
          <LoadingSpinner size="sm" text="Processing image..." variant="blue" />
        ) : isConverting ? (
          <LoadingSpinner size="sm" text="Converting HEIC image to JPEG..." variant="gray" />
        ) : searchResults ? (
          renderResultsView()
        ) : showCamera ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-6 w-full">
              <video ref={videoRef} autoPlay playsInline muted className="mx-auto max-h-[50vh] rounded-lg" />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="flex w-full flex-col items-center justify-center space-y-6">
              <button
                onClick={handleTakePicture}
                disabled={!isStreamActive || isConverting}
                className="btn btn-primary mx-auto w-full max-w-sm py-2"
              >
                Take Picture
              </button>
              <button onClick={switchToUpload} disabled={isConverting} className="btn w-full max-w-sm py-2">
                Upload Image
              </button>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="text-center">
            <div className="relative mx-auto flex w-full max-w-[360px] sm:max-w-[480px]">
              <Image
                src={previewUrl}
                alt="Selected preview"
                width={0}
                height={0}
                className="h-auto w-full rounded-md border object-contain shadow-md"
              />
            </div>

            <div className="mt-6 space-y-6">
              <button
                onClick={handleImageSubmit}
                disabled={isLoading}
                className="btn btn-primary mx-auto w-full max-w-sm py-2"
              >
                {isLoading ? 'Processing...' : 'Search with this Image'}
              </button>
              <button onClick={clearSelectionAndRestartCamera} className="btn mx-auto w-full max-w-sm py-2">
                Choose Different Image
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center">
            {!cameraError && (
              <LoadingSpinner size="sm" text="Starting camera..." variant="blue" className="py-0" />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cameraError ? 'Camera unavailable.' : 'If you prefer to upload an image:'}
            </p>
            <button onClick={switchToUpload} disabled={isConverting} className="btn w-full py-2">
              Upload Image
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            onBlur={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
          />
        </div>
      </div>
    </Dialog>
  )
}
