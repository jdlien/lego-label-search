'use client'

import React, { useRef, useEffect } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideCloseButton?: boolean
  actions?: React.ReactNode
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'md',
  hideCloseButton = false,
  actions,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const lastFocusedElement = useRef<HTMLElement | null>(null)

  // Size mapping for the dialog
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  // Open or close the dialog when the open prop changes
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      lastFocusedElement.current = document.activeElement as HTMLElement
      dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  // Handle ESC key and clicking outside the dialog
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
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
      className={`rounded-lg border-none p-0 w-[90vw] ${sizeClasses[size]} max-h-[90vh] bg-white dark:bg-gray-800 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm`}
    >
      {title && (
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-6rem)]">{children}</div>

      {actions && (
        <div className="flex justify-end gap-2 p-4 pt-2 border-t border-gray-200 dark:border-gray-600">{actions}</div>
      )}

      {/* Default close button if no actions are provided */}
      {!actions && (
        <div className="flex justify-end p-4 pt-2 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </dialog>
  )
}
