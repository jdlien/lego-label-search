'use client'

import { useState, useCallback } from 'react'
import convert from 'heic-convert'

type UseHeicConverterOptions = {
  /** JPEG quality (0-1), defaults to 0.85 */
  quality?: number
  /** Callback when conversion error occurs */
  onError?: (error: string) => void
}

type UseHeicConverterReturn = {
  /** Whether conversion is in progress */
  isConverting: boolean
  /** Convert a HEIC file to JPEG, returns the converted File */
  convertToJpeg: (file: File) => Promise<File>
  /** Check if a file is a HEIC file */
  isHeicFile: (file: File) => boolean
  /** Process a file - converts if HEIC, returns original otherwise */
  processFile: (file: File) => Promise<File>
}

/**
 * Hook for converting HEIC images to JPEG format.
 *
 * HEIC (High Efficiency Image Container) is commonly used by iOS devices
 * but not widely supported by web browsers. This hook provides utilities
 * to detect and convert HEIC files to JPEG.
 *
 * @example
 * ```tsx
 * const { isConverting, processFile, isHeicFile } = useHeicConverter()
 *
 * const handleFileSelect = async (file: File) => {
 *   // Automatically converts HEIC to JPEG, or returns original file
 *   const processedFile = await processFile(file)
 *   // Use processedFile...
 * }
 * ```
 */
export function useHeicConverter(options: UseHeicConverterOptions = {}): UseHeicConverterReturn {
  const { quality = 0.85, onError } = options

  const [isConverting, setIsConverting] = useState(false)

  const isHeicFile = useCallback((file: File): boolean => {
    const heicExtensions = ['.heic', '.heif']
    return heicExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  }, [])

  const convertToJpeg = useCallback(
    async (file: File): Promise<File> => {
      try {
        setIsConverting(true)

        // Convert file to buffer
        const buffer = await file.arrayBuffer()
        const inputBuffer = new Uint8Array(buffer)

        // Convert HEIC to JPEG
        const outputBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality,
        })

        // Create a new File object with the converted data
        const jpegBlob = new Blob([outputBuffer], { type: 'image/jpeg' })
        const originalNameWithoutExt = file.name.replace(/\.(heic|heif)$/i, '')
        const convertedFile = new File([jpegBlob], `${originalNameWithoutExt}_converted.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })

        return convertedFile
      } catch (err) {
        console.error('Error converting HEIC to JPEG:', err)
        const errorMessage = 'Failed to convert HEIC image. Please try a different image format.'
        onError?.(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsConverting(false)
      }
    },
    [quality, onError]
  )

  const processFile = useCallback(
    async (file: File): Promise<File> => {
      if (isHeicFile(file)) {
        return convertToJpeg(file)
      }
      return file
    },
    [isHeicFile, convertToJpeg]
  )

  return {
    isConverting,
    convertToJpeg,
    isHeicFile,
    processFile,
  }
}
