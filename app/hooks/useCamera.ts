'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type UseCameraOptions = {
  /** Camera facing mode - 'environment' for back camera, 'user' for front camera */
  facingMode?: 'environment' | 'user'
  /** Callback when camera error occurs */
  onError?: (error: string) => void
}

type UseCameraReturn = {
  /** Ref to attach to video element */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Ref to attach to canvas element (used for capturing) */
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  /** Whether camera stream is currently active */
  isStreamActive: boolean
  /** Camera error message, if any */
  cameraError: string | null
  /** Start the camera stream */
  startCamera: () => Promise<void>
  /** Stop the camera stream */
  stopCamera: () => void
  /** Take a picture from the current video frame, returns a File */
  takePicture: () => File | null
  /** Clear camera error */
  clearError: () => void
}

/**
 * Hook for managing camera access and picture capture.
 *
 * Handles:
 * - Camera permission requests
 * - Video stream management
 * - Picture capture to File
 * - Error handling
 *
 * @example
 * ```tsx
 * const { videoRef, canvasRef, isStreamActive, startCamera, takePicture } = useCamera({
 *   facingMode: 'environment',
 * })
 *
 * // In JSX:
 * <video ref={videoRef} autoPlay playsInline muted />
 * <canvas ref={canvasRef} style={{ display: 'none' }} />
 * <button onClick={takePicture} disabled={!isStreamActive}>Take Picture</button>
 * ```
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = 'environment', onError } = options

  const [isStreamActive, setIsStreamActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreamActive(false)
  }, [])

  const startCamera = useCallback(async () => {
    // Stop any existing stream first
    stopCamera()
    setCameraError(null)
    setIsStreamActive(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreamActive(true)
      } else {
        // Video element not available, clean up the stream
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('Video element not available.')
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      const errorMessage = 'Could not access camera. Please ensure permissions are granted and a camera is available.'
      setCameraError(errorMessage)
      setIsStreamActive(false)
      onError?.(errorMessage)
    }
  }, [facingMode, stopCamera, onError])

  const takePicture = useCallback((): File | null => {
    if (!videoRef.current || !canvasRef.current || !isStreamActive) {
      console.warn('Take picture called but stream not active or refs not set')
      setCameraError('Could not take picture. Camera not ready.')
      return null
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      setCameraError('Could not take picture. Canvas context not available.')
      return null
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob synchronously using toDataURL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    const byteString = atob(dataUrl.split(',')[1])
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeString })
    const file = new File([blob], `captured_image_${Date.now()}.jpg`, { type: 'image/jpeg' })

    return file
  }, [isStreamActive])

  const clearError = useCallback(() => {
    setCameraError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    canvasRef,
    isStreamActive,
    cameraError,
    startCamera,
    stopCamera,
    takePicture,
    clearError,
  }
}
