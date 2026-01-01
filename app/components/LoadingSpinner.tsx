import React from 'react'

type LoadingSpinnerProps = {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Optional text to display below the spinner */
  text?: string
  /** Color variant for the spinner border */
  variant?: 'blue' | 'gray'
  /** Custom class name for the container */
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

const variantClasses = {
  blue: 'border-blue-500',
  gray: 'border-gray-400 dark:border-gray-500',
}

/**
 * A spinning loading indicator with optional text.
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" text="Loading part details..." />
 * ```
 */
export default function LoadingSpinner({
  size = 'md',
  text,
  variant = 'blue',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} ${variantClasses[variant]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>
      )}
    </div>
  )
}
