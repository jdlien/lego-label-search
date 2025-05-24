'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { IconXMark } from './InputField/InputIcons'

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  title?: string
  description: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Toast context for managing toasts
interface ToastContextValue {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

// Stable ID generator to avoid hydration mismatches
let toastCounter = 0
const generateToastId = () => {
  toastCounter += 1
  return `toast-${toastCounter}-${Date.now()}`
}

// Hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider component using Popover API
interface ToastProviderProps {
  children: ReactNode
  swipeDirection?: 'right' | 'left' | 'up' | 'down'
}

export function ToastProvider({ children, swipeDirection = 'right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Ensure we only render portal on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Show/hide popover based on toast presence
  useEffect(() => {
    if (!popoverRef.current) return

    if (toasts.length > 0) {
      popoverRef.current.showPopover?.()
    } else {
      popoverRef.current.hidePopover?.()
    }
  }, [toasts.length])

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateToastId()
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toastElements = (
    <div
      ref={popoverRef}
      popover="manual"
      className="fixed right-0 bottom-0 z-auto m-0 flex max-h-screen w-full max-w-[420px] list-none flex-col-reverse gap-2 border-0 bg-transparent p-4 outline-none"
      style={{
        // Reset popover defaults to match original positioning
        inset: 'unset',
        position: 'fixed',
        right: '0',
        bottom: '0',
        left: 'unset',
        top: 'unset',
        width: '100%',
        maxWidth: '420px',
        height: 'auto',
        maxHeight: '100vh',
        margin: '0',
        padding: '1rem',
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} swipeDirection={swipeDirection} />
      ))}
    </div>
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {isMounted && createPortal(toastElements, document.body)}
    </ToastContext.Provider>
  )
}

// Individual Toast component with swipe support
interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
  swipeDirection: 'right' | 'left' | 'up' | 'down'
}

function Toast({ toast, onRemove, swipeDirection }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const toastRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss timer
  useEffect(() => {
    if (isExiting) return

    const timer = setTimeout(() => {
      handleDismiss()
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, isExiting])

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300) // Allow exit animation
  }, [toast.id, onRemove])

  // Touch/Mouse handlers for swipe-to-dismiss
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    currentPos.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      currentPos.current = { x: e.clientX, y: e.clientY }

      let offset = 0
      const deltaX = currentPos.current.x - startPos.current.x
      const deltaY = currentPos.current.y - startPos.current.y

      switch (swipeDirection) {
        case 'right':
          offset = Math.max(0, deltaX)
          break
        case 'left':
          offset = Math.min(0, deltaX)
          break
        case 'up':
          offset = Math.min(0, deltaY)
          break
        case 'down':
          offset = Math.max(0, deltaY)
          break
      }

      setDragOffset(offset)
    },
    [isDragging, swipeDirection]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      setIsDragging(false)
      e.currentTarget.releasePointerCapture(e.pointerId)

      const deltaX = currentPos.current.x - startPos.current.x
      const deltaY = currentPos.current.y - startPos.current.y
      const threshold = 50

      let shouldDismiss = false
      switch (swipeDirection) {
        case 'right':
          shouldDismiss = deltaX > threshold
          break
        case 'left':
          shouldDismiss = deltaX < -threshold
          break
        case 'up':
          shouldDismiss = deltaY < -threshold
          break
        case 'down':
          shouldDismiss = deltaY > threshold
          break
      }

      if (shouldDismiss) {
        handleDismiss()
      } else {
        setDragOffset(0)
      }
    },
    [isDragging, swipeDirection, handleDismiss]
  )

  const getToastStyles = (type: ToastType) => {
    const baseStyles =
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg backdrop-blur-xs transition-all duration-300 cursor-grab active:cursor-grabbing select-none text-shadow-sm text-shadow-white/40 dark:text-shadow-black/30'

    // Handle visibility and exit animations
    let transformStyles = ''
    if (!isVisible) {
      // Enter from bottom
      transformStyles = 'translate-y-full opacity-0 scale-95'
    } else if (isExiting) {
      // Exit according to swipe direction
      switch (swipeDirection) {
        case 'right':
          transformStyles = 'translate-x-full opacity-0 scale-95'
          break
        case 'left':
          transformStyles = '-translate-x-full opacity-0 scale-95'
          break
        case 'up':
          transformStyles = '-translate-y-full opacity-0 scale-95'
          break
        case 'down':
          transformStyles = 'translate-y-full opacity-0 scale-95'
          break
      }
    } else {
      transformStyles = 'translate-x-0 translate-y-0 opacity-100 scale-100'
    }

    // Handle drag offset
    if (isDragging && dragOffset !== 0) {
      const isHorizontal = swipeDirection === 'left' || swipeDirection === 'right'
      if (isHorizontal) {
        transformStyles = `translate-x-[${dragOffset}px] opacity-100 scale-100`
      } else {
        transformStyles = `translate-y-[${dragOffset}px] opacity-100 scale-100`
      }
    }

    switch (type) {
      case 'success':
        return `${baseStyles} ${transformStyles} border-green-200 bg-green-200/60 text-green-900 dark:border-green-800 dark:border-t-green-700 dark:bg-green-700/60 dark:text-green-100`
      case 'error':
        return `${baseStyles} ${transformStyles} border-red-200 bg-red-200/60 text-red-900 dark:border-red-800 dark:border-t-red-700 dark:bg-red-700/60 dark:text-red-100`
      case 'warning':
        return `${baseStyles} ${transformStyles} border-yellow-200 bg-yellow-200/60 text-yellow-900 dark:border-yellow-800 dark:border-t-yellow-700 dark:bg-yellow-600/60 dark:text-yellow-100`
      case 'info':
        return `${baseStyles} ${transformStyles} border-sky-200 bg-sky-200/60 text-sky-900 dark:border-sky-800 dark:border-t-sky-700 dark:bg-sky-700/60 dark:text-sky-100`
      default:
        return `${baseStyles} ${transformStyles} border-gray-200 bg-gray-200/60 text-gray-900 dark:border-gray-800 dark:border-t-gray-700 dark:bg-gray-900/60 dark:text-gray-100`
    }
  }

  return (
    <div
      ref={toastRef}
      className={getToastStyles(toast.type)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        transform:
          isDragging && dragOffset !== 0
            ? swipeDirection === 'left' || swipeDirection === 'right'
              ? `translateX(${dragOffset}px)`
              : `translateY(${dragOffset}px)`
            : undefined,
        transition: isDragging ? 'none' : undefined,
      }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="grid gap-1">
        {toast.title && (
          <div className="font-semibold" role="heading" aria-level={3}>
            {toast.title}
          </div>
        )}
        <div className="text-base">{toast.description}</div>
      </div>

      {toast.action && (
        <button
          className="hover:bg-opacity-10 inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-current bg-transparent px-3 text-sm font-medium transition-colors hover:bg-current focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          onClick={toast.action.onClick}
          type="button"
        >
          {toast.action.label}
        </button>
      )}

      <button
        className="absolute top-2 right-2 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        onClick={handleDismiss}
        aria-label="Close notification"
        type="button"
      >
        <IconXMark className="h-4 w-4" />
      </button>
    </div>
  )
}

// Convenience hooks for different toast types
export const useToastHelpers = () => {
  const { addToast } = useToast()

  const success = useCallback(
    (description: string, options?: Partial<ToastData>) => {
      addToast({ type: 'success', description, ...options })
    },
    [addToast]
  )

  const error = useCallback(
    (description: string, options?: Partial<ToastData>) => {
      addToast({ type: 'error', description, ...options })
    },
    [addToast]
  )

  const warning = useCallback(
    (description: string, options?: Partial<ToastData>) => {
      addToast({ type: 'warning', description, ...options })
    },
    [addToast]
  )

  const info = useCallback(
    (description: string, options?: Partial<ToastData>) => {
      addToast({ type: 'info', description, ...options })
    },
    [addToast]
  )

  return { success, error, warning, info, addToast }
}
