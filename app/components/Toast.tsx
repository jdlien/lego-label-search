'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
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

// Hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider component
interface ToastProviderProps {
  children: ReactNode
  swipeDirection?: 'right' | 'left' | 'up' | 'down'
}

export function ToastProvider({ children, swipeDirection = 'right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <ToastPrimitive.Provider swipeDirection={swipeDirection}>
        {children}
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-50 m-0 flex max-h-screen w-full max-w-[420px] list-none flex-col-reverse gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

// Individual Toast component
interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
}

function Toast({ toast, onRemove }: ToastProps) {
  const getToastStyles = (type: ToastType) => {
    const baseStyles =
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg backdrop-blur-xs'

    switch (type) {
      case 'success':
        return `${baseStyles} border-green-200 bg-green-200/50 text-green-900 dark:border-green-800 dark:border-t-green-700 dark:bg-green-700/50 dark:text-green-100`
      case 'error':
        return `${baseStyles} border-red-200 bg-red-200/50 text-red-900 dark:border-red-800 dark:border-t-red-700 dark:bg-red-700/50 dark:text-red-100`
      case 'warning':
        return `${baseStyles} border-yellow-200 bg-yellow-200/50 text-yellow-900 dark:border-yellow-800 dark:border-t-yellow-700 dark:bg-yellow-600/50 dark:text-yellow-100`
      case 'info':
        return `${baseStyles} border-sky-200 bg-sky-200/50 text-sky-900 dark:border-sky-800 dark:border-t-sky-700 dark:bg-sky-700/40 dark:text-sky-100`
      default:
        return `${baseStyles} border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:border-t-gray-700 dark:bg-gray-900 dark:text-gray-100`
    }
  }

  return (
    <ToastPrimitive.Root
      className={`toast ${getToastStyles(toast.type)}`}
      duration={toast.duration || 5000}
      defaultOpen={true}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            onRemove(toast.id)
          }, 250)
        }
      }}
    >
      <div className="grid gap-1">
        {toast.title && <ToastPrimitive.Title className="text-sm font-semibold">{toast.title}</ToastPrimitive.Title>}
        <ToastPrimitive.Description className="text-sm">{toast.description}</ToastPrimitive.Description>
      </div>

      {toast.action && (
        <ToastPrimitive.Action
          altText={toast.action.label}
          className="hover:bg-opacity-10 inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-current bg-transparent px-3 text-xs font-medium transition-colors hover:bg-current focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          onClick={toast.action.onClick}
        >
          {toast.action.label}
        </ToastPrimitive.Action>
      )}

      <ToastPrimitive.Close
        className="absolute top-2 right-2 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        aria-label="Close"
      >
        <IconXMark className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

// Convenience hooks for different toast types
export const useToastHelpers = () => {
  const { addToast } = useToast()

  const success = (description: string, options?: Partial<ToastData>) => {
    addToast({ type: 'success', description, ...options })
  }

  const error = (description: string, options?: Partial<ToastData>) => {
    addToast({ type: 'error', description, ...options })
  }

  const warning = (description: string, options?: Partial<ToastData>) => {
    addToast({ type: 'warning', description, ...options })
  }

  const info = (description: string, options?: Partial<ToastData>) => {
    addToast({ type: 'info', description, ...options })
  }

  return { success, error, warning, info, addToast }
}
