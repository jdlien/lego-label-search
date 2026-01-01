'use client'

import { useState, useCallback } from 'react'
import { useToastHelpers } from '../components/ToastPop'

type UseLabelDownloadOptions = {
  /** Callback when label is confirmed to not exist */
  onLabelNotFound?: () => void
}

type UseLabelDownloadReturn = {
  /** Download the 12mm label for the part */
  download12mm: (e?: React.MouseEvent) => Promise<void>
  /** Download the 24mm label for the part (with conversion) */
  download24mm: (e?: React.MouseEvent) => Promise<void>
  /** Whether 12mm download is in progress */
  isDownloading: boolean
  /** Whether 24mm conversion is in progress */
  isConverting: boolean
  /** Whether a label exists for this part (null if unknown) */
  labelExists: boolean | null
  /** Reset the labelExists state */
  resetLabelExists: () => void
}

/**
 * Hook for downloading LEGO part labels in 12mm and 24mm formats.
 *
 * Handles:
 * - Fetching and triggering file downloads
 * - Label conversion from 12mm to 24mm
 * - Loading states
 * - Toast notifications for errors/warnings
 *
 * @param partId - The part number to download labels for
 * @param options - Optional configuration
 */
export function useLabelDownload(
  partId: string | null | undefined,
  options: UseLabelDownloadOptions = {}
): UseLabelDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [labelExists, setLabelExists] = useState<boolean | null>(null)
  const { error: showError, warning } = useToastHelpers()

  const { onLabelNotFound } = options

  /**
   * Trigger a file download by fetching the file as a blob and creating a download link.
   */
  const triggerDownload = useCallback(
    async (fileUrl: string, fileName: string): Promise<boolean> => {
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
        return true
      } catch (err) {
        console.error('Error triggering download:', err)
        showError('Could not start the file download.')
        return false
      }
    },
    [showError]
  )

  /**
   * Download the 12mm label for the current part.
   */
  const download12mm = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (isDownloading || !partId) return

      setIsDownloading(true)
      try {
        const response = await fetch(`/api/download-label?part_num=${partId}`)
        const data = await response.json()

        if (data.success) {
          await triggerDownload(`/data/labels/${partId}.lbx`, `${partId}.lbx`)
          setLabelExists(true)
        } else {
          setLabelExists(false)
          warning('This part does not have a label available.')
          onLabelNotFound?.()
        }
      } catch (err) {
        console.error('Error downloading label:', err)
        showError('There was an error downloading the label.')
      } finally {
        setIsDownloading(false)
      }
    },
    [partId, isDownloading, triggerDownload, warning, showError, onLabelNotFound]
  )

  /**
   * Download the 24mm label for the current part.
   * This first ensures the 12mm label exists, then converts it to 24mm format.
   */
  const download24mm = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (isConverting || !partId) return

      setIsConverting(true)
      try {
        // First, ensure the original label exists
        const downloadResponse = await fetch(`/api/download-label?part_num=${partId}`)
        const downloadData = await downloadResponse.json()

        if (!downloadData.success) {
          setLabelExists(false)
          warning('The original label is not available for conversion.')
          onLabelNotFound?.()
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
          const isEscapeSequenceWarning =
            data.message && data.message.includes('SyntaxWarning: invalid escape sequence')

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
    },
    [partId, isConverting, triggerDownload, warning, showError, onLabelNotFound]
  )

  const resetLabelExists = useCallback(() => {
    setLabelExists(null)
  }, [])

  return {
    download12mm,
    download24mm,
    isDownloading,
    isConverting,
    labelExists,
    resetLabelExists,
  }
}

export default useLabelDownload
