/**
 * Shared SVG icons used across components
 */

import React from 'react'

type IconProps = {
  className?: string
}

/**
 * Placeholder icon for when a LEGO part image is not available.
 * Shows three dots in a row to indicate loading or missing content.
 */
export const BrickPlaceholder = ({ className = 'h-10 w-10 text-gray-400 dark:text-gray-500' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="6" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="18" cy="12" r="2" />
  </svg>
)

/**
 * Download icon for download buttons.
 * Arrow pointing down into a tray.
 */
export const DownloadIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

/**
 * Error/alert icon for error states.
 * Circle with exclamation mark.
 */
export const ErrorIcon = ({ className = 'h-6 w-6 text-red-500' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

/**
 * Spinner icon for loading states.
 * Circular arc that can be animated with animate-spin.
 */
export const SpinnerIcon = ({ className = 'h-12 w-12 text-blue-500' }: IconProps) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)
