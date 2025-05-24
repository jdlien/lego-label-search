'use client'

import React, { useRef, useEffect, useState } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl'
  hideCloseButton?: boolean
  actions?: React.ReactNode
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  size = '2xl',
  hideCloseButton = false,
  actions,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const lastFocusedElement = useRef<HTMLElement | null>(null)
  const [shouldShow, setShouldShow] = useState(false)

  // Size mapping for the dialog
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    '8xl': 'max-w-8xl',
  }

  // Open or close the dialog when the open prop changes
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      lastFocusedElement.current = document.activeElement as HTMLElement
      dialog.showModal()
      // Start the opening animation
      setShouldShow(true)
      // Allow animation to complete
      const timer = setTimeout(() => {}, 300)
      return () => clearTimeout(timer)
    } else if (dialog.open) {
      // Start the closing animation
      setShouldShow(false)
      // Close the dialog after animation completes
      const timer = setTimeout(() => {
        dialog.close()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle ESC key and clicking outside the dialog
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      // Check if the cancel event originated from a file input
      const target = e.target as HTMLElement
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'file') {
        e.preventDefault()
        return
      }

      // Otherwise, this is likely an ESC key press, so close the dialog
      e.preventDefault()
      onClose()
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target === dialog) {
        onClose()
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose])

  // Return focus to the previous element when dialog closes
  useEffect(() => {
    if (!open && lastFocusedElement.current) {
      lastFocusedElement.current.focus()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={`w-[92vw] rounded-lg border p-0 text-gray-800 dark:text-white ${sizeClasses[size]} mx-auto mt-6 max-h-[90vh] border border-gray-200 bg-white shadow-3xl transition-all duration-300 ease-out backdrop:duration-400 sm:mt-28 dark:border-gray-700 dark:border-t-gray-600 dark:bg-gray-800 ${
        shouldShow ? 'opacity-100 backdrop:bg-black/50' : 'opacity-0 backdrop:bg-transparent'
      }`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-700/70">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="rounded-full text-gray-400 transition-colors duration-150 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="max-h-[calc(90vh-6rem)] overflow-y-auto p-4 md:p-6">{children}</div>

      {actions && (
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 pt-2 dark:border-gray-600">{actions}</div>
      )}
    </dialog>
  )
}
