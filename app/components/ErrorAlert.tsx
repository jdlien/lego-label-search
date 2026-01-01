import React from 'react'
import { ErrorIcon } from './icons'

type ErrorAlertProps = {
  /** Error message to display */
  message: string
  /** Optional title (defaults to "Error") */
  title?: string
  /** Custom class name for the container */
  className?: string
}

/**
 * An error alert box with icon and message.
 *
 * @example
 * ```tsx
 * <ErrorAlert message="Failed to load part details" />
 * <ErrorAlert title="Connection Error" message="Unable to reach the server" />
 * ```
 */
export default function ErrorAlert({
  message,
  title = 'Error',
  className = '',
}: ErrorAlertProps) {
  return (
    <div
      className={`rounded-md border border-red-400 bg-red-100 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300 ${className}`}
      role="alert"
    >
      <div className="flex">
        <ErrorIcon className="mr-2 h-6 w-6 flex-shrink-0 text-red-500" />
        <div>
          <p className="font-bold">{title}</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  )
}
