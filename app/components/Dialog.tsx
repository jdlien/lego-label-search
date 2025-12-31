'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useDialogContextSafe } from '../context/DialogContext'
import { DialogToastHost } from './ToastPop'

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
  const dialogContext = useDialogContextSafe()

  // Size mapping for the dialog panel
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
      // Register this dialog with the context
      dialogContext?.setDialogOpen(true)
      // Start the opening animation
      setShouldShow(true)
      // Allow animation to complete
      const timer = setTimeout(() => {}, 300)
      return () => clearTimeout(timer)
    } else if (dialog.open) {
      // Start the closing animation
      setShouldShow(false)
      // Close the dialog and unregister from context after animation completes
      const timer = setTimeout(() => {
        dialog.close()
        dialogContext?.setDialogOpen(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, dialogContext])

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

    dialog.addEventListener('cancel', handleCancel)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  // Return focus to the previous element when dialog closes
  useEffect(() => {
    if (!open && lastFocusedElement.current) {
      lastFocusedElement.current.focus()
    }
  }, [open])

  // Handle backdrop click (click on dialog element itself, not its children)
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Only close if clicking the dialog element directly (the backdrop area)
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="m-0 h-screen max-h-screen w-screen max-w-full overflow-visible bg-transparent p-0 backdrop:bg-transparent"
    >
      {/* Toast host - fixed overlay inside dialog subtree, OUTSIDE animated panel */}
      <div className="pointer-events-none fixed inset-0 z-[9999]">
        <DialogToastHost />
      </div>

      {/* Backdrop - separate div we control for animation */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          shouldShow ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content panel - gets the transitions */}
      <div
        className={`relative mx-auto mt-6 w-[92vw] ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-800 shadow-3xl transition-all duration-300 ease-out lg:mt-28 dark:border-gray-700 dark:border-t-gray-600 dark:bg-gray-800 dark:text-white ${
          shouldShow ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
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

        <div className="max-h-[calc(94vh-6rem)] overflow-y-auto p-4 md:p-6">{children}</div>

        {actions && (
          <div className="flex justify-end gap-2 border-t border-gray-200 p-4 pt-2 dark:border-gray-600">{actions}</div>
        )}
      </div>
    </dialog>
  )
}
