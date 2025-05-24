'use client'

import React, { useState, useEffect, useRef } from 'react'
import Dialog from './Dialog'

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
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [apiStatus, setApiStatus] = useState({ isChecking: false, isAvailable: true })
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setIsLoading(false)
      setShowCamera(true)
    } else {
      stopCameraStream()
      setShowCamera(false)
      setSelectedImage(null)
      setSearchResults(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (isOpen && showCamera) {
      startCamera()
    } else if (isOpen && !showCamera) {
      stopCameraStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showCamera])

  const checkApiHealth = async () => {
    setApiStatus({ isChecking: true, isAvailable: false })
    try {
      const healthResponse = await fetch('/api/health', {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
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
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Only stop camera and change view state if a file was actually selected
      stopCameraStream()
      setShowCamera(false)
      setSelectedImage(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
    // Reset the input value to allow selecting the same file again
    // and to ensure clean state after cancel
    event.target.value = ''
  }

  const startCamera = async () => {
    // Stop any existing stream first
    stopCameraStream()

    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setShowCamera(true)
    setError(null)
    setIsStreamActive(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreamActive(true)
      } else {
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('Video element not available.')
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please ensure permissions are granted and a camera is available.')
      setShowCamera(false)
      setIsStreamActive(false)
    }
  }

  const stopCameraStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreamActive(false)
  }

  const takePicture = () => {
    if (videoRef.current && canvasRef.current && isStreamActive) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        stopCameraStream()
        setShowCamera(false)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured_image_${Date.now()}.jpg`, { type: 'image/jpeg' })
            setSelectedImage(file)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(URL.createObjectURL(file))
          }
        }, 'image/jpeg')
      }
    } else {
      console.warn('Take picture called but stream not active or refs not set')
      setError('Could not take picture. Camera not ready.')
    }
  }

  const switchToUpload = (e?: React.MouseEvent) => {
    // Prevent any event bubbling that might interfere with modal
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Clear any existing value first to ensure clean state
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      // Add a small delay to ensure the input is ready
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 10)
    }
  }

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    switchToUpload(e)
  }

  const clearSelectionAndRestartCamera = () => {
    // First stop the current camera stream
    stopCameraStream()

    // Reset all state
    setSelectedImage(null)
    setSearchResults(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)

    // Use setTimeout to ensure cleanup is complete before restarting
    setTimeout(() => {
      setShowCamera(true) // This will trigger the useEffect to call startCamera()
    }, 100)
  }

  const handleImageSubmit = async () => {
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
  }

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

  const renderResultsView = () => {
    if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
      return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center">
            <svg className="mr-2 h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200">No matching items found</span>
          </div>
          <button onClick={clearSelectionAndRestartCamera} className="btn mt-3 w-full py-2 font-medium">
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
                  <img
                    src={item.img_url}
                    alt={item.name}
                    className="w-full"
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

        <button onClick={clearSelectionAndRestartCamera} className="btn mt-4 w-full py-2 font-medium">
          Search New Image
        </button>
      </div>
    )
  }

  const modalTitle = searchResults ? 'Search Results' : 'Image Search'

  return (
    <Dialog open={isOpen} onClose={onClose} title={modalTitle} size="3xl">
      <div className="">
        {!apiStatus.isAvailable && !apiStatus.isChecking && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="text-center">
              <p className="font-medium text-red-800 dark:text-red-200">
                The image search service is currently unavailable
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                Please try again later or contact support if the issue persists.
              </p>
              <button onClick={checkApiHealth} className="btn mt-2">
                Retry Connection
              </button>
            </div>
          </div>
        )}

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

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600"></div>
            <span className="ml-3 font-medium">Processing image...</span>
          </div>
        ) : searchResults ? (
          renderResultsView()
        ) : showCamera ? (
          <div className="flex flex-col">
            <div className="relative mb-6 w-full">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full rounded-lg object-contain" />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="space-y-6">
              <button onClick={takePicture} disabled={!isStreamActive} className="btn btn-primary w-full py-2">
                Take Picture
              </button>
              <button onClick={handleUploadClick} className="btn w-full py-2">
                Upload Image
              </button>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="text-center">
            <img
              src={previewUrl}
              alt="Selected preview"
              className="mx-auto max-h-72 max-w-full rounded-lg border border-gray-200 object-contain dark:border-gray-600"
            />
            <div className="mt-6 space-y-6">
              <button onClick={handleImageSubmit} disabled={isLoading} className="btn btn-primary w-full py-2">
                {isLoading ? 'Processing...' : 'Search with this Image'}
              </button>
              <button onClick={clearSelectionAndRestartCamera} className="btn w-full py-2">
                Choose Different Image
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center">
            {!error && (
              <div className="flex items-center justify-center">
                <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Starting camera...</span>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If the camera doesn&apos;t start, or you prefer to upload:
            </p>
            <button onClick={handleUploadClick} className="btn w-full py-2">
              Upload Image
            </button>
            <button onClick={startCamera} className="btn w-full py-2">
              Retry Camera
            </button>
          </div>
        )}

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
            onBlur={(e) => {
              // Prevent blur events from interfering with dialog
              e.stopPropagation()
            }}
            onFocus={(e) => {
              // Prevent focus events from interfering with dialog
              e.stopPropagation()
            }}
            onClick={(e) => {
              // Prevent click events from bubbling to dialog
              e.stopPropagation()
            }}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
          />
        </div>
      </div>
    </Dialog>
  )
}
