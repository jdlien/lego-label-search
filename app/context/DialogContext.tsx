'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DialogContextValue {
  isDialogOpen: boolean
  setDialogOpen: (open: boolean) => void
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const setDialogOpen = useCallback((open: boolean) => {
    setIsDialogOpen(open)
  }, [])

  return (
    <DialogContext.Provider value={{ isDialogOpen, setDialogOpen }}>
      {children}
    </DialogContext.Provider>
  )
}
