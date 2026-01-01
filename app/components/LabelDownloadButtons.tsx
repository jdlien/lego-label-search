'use client'

import React from 'react'
import { DownloadIcon } from './icons'
import { useLabelDownload } from '../hooks/useLabelDownload'

type LabelDownloadButtonsProps = {
  /** Part number to download labels for */
  partId: string | null | undefined
  /** Layout direction for the buttons */
  layout?: 'horizontal' | 'vertical'
  /** Button size variant */
  size?: 'sm' | 'base'
  /** Custom class name for the container */
  className?: string
}

/**
 * Download buttons for LEGO part labels (12mm and 24mm formats).
 *
 * Integrates with the useLabelDownload hook to handle:
 * - Download triggering and progress states
 * - Label availability detection
 * - Toast notifications for errors/warnings
 *
 * @example
 * ```tsx
 * <LabelDownloadButtons partId="3001" layout="horizontal" />
 * ```
 */
export default function LabelDownloadButtons({
  partId,
  layout = 'horizontal',
  size = 'base',
  className = '',
}: LabelDownloadButtonsProps) {
  const { download12mm, download24mm, isDownloading, isConverting, labelExists } =
    useLabelDownload(partId)

  // If we've determined the label doesn't exist, show a message
  if (labelExists === false) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        No label available
      </div>
    )
  }

  const textSize = size === 'sm' ? 'text-sm' : 'text-base'
  const spacing = layout === 'horizontal' ? 'space-x-6' : 'space-y-2'
  const flexDirection = layout === 'horizontal' ? 'flex-row' : 'flex-col'

  return (
    <div className={`flex ${flexDirection} ${spacing} ${className}`}>
      <button
        className={`link flex items-center space-x-2 ${textSize}`}
        onClick={download12mm}
        disabled={isDownloading || !partId}
        title="Download 12mm Label"
        aria-label="Download 12mm Label"
      >
        <DownloadIcon />
        <span>{isDownloading ? 'Downloading...' : 'LBX 12mm'}</span>
      </button>
      <button
        className={`link flex items-center space-x-2 ${textSize}`}
        onClick={download24mm}
        disabled={isConverting || !partId}
        title="Download 24mm Label"
        aria-label="Download 24mm Label"
      >
        <DownloadIcon />
        <span>{isConverting ? 'Converting...' : 'LBX 24mm'}</span>
      </button>
    </div>
  )
}
