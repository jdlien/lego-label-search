'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DialogContextValue {
  activeDialog: HTMLDialogElement | null
  setActiveDialog: (dialog: HTMLDialogElement | null) => void
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined)

export function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialogContext must be used within a DialogProvider')
  }
  return context
}

// Optional hook that doesn't throw - useful for components that may be outside the provider
export function useDialogContextSafe() {
  return useContext(DialogContext)
}

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [activeDialog, setActiveDialogState] = useState<HTMLDialogElement | null>(null)

  const setActiveDialog = useCallback((dialog: HTMLDialogElement | null) => {
    setActiveDialogState(dialog)
  }, [])

  return (
    <DialogContext.Provider value={{ activeDialog, setActiveDialog }}>
      {children}
    </DialogContext.Provider>
  )
}
