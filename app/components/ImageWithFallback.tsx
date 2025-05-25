import React, { useState } from 'react'
import Image from 'next/image'

type ImageWithFallbackProps = {
  partId: string
  alt: string
  width: number
  height: number
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
}

// SVG icon for fallback when image fails to load
const BrickPlaceholder = ({ size = 'h-10 w-10' }: { size?: string }) => (
  <svg viewBox="0 0 24 24" className={`${size} text-gray-400 dark:text-gray-500`} fill="currentColor">
    <circle cx="6" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="18" cy="12" r="2" />
  </svg>
)

export default function ImageWithFallback({
  partId,
  alt,
  width,
  height,
  className = '',
  fallback,
  priority = false,
}: ImageWithFallbackProps) {
  const normalizedPartId = partId.replace(/^0+/, '')
  const webpPath = `/data/images/${normalizedPartId}.webp`
  const pngPath = `/data/images/${normalizedPartId}.png`

  const [currentSrc, setCurrentSrc] = useState(webpPath)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (currentSrc === webpPath) {
      // Try PNG version
      setCurrentSrc(pngPath)
    } else {
      // Both failed, show fallback
      setHasError(true)
    }
  }

  if (hasError) {
    return fallback || <BrickPlaceholder size={width > 100 ? 'h-16 w-16' : 'h-10 w-10'} />
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      priority={priority}
      style={{ width: 'auto', height: 'auto' }}
    />
  )
}
