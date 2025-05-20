'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import type { ThemeColor, AccentColor, UISize } from '../types/theme'

// Define the shape of our theme context
export interface ThemeContextType {
  defaultTheme: ThemeColor
  defaultAccent: AccentColor
  defaultUISize: UISize
}

// Create the context with default values
export const ThemeContext = createContext<ThemeContextType>({
  defaultTheme: 'gray',
  defaultAccent: 'sky',
  defaultUISize: 'md',
})

// Provider component
interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeColor
  defaultAccent?: AccentColor
  defaultUISize?: UISize
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'gray',
  defaultAccent = 'sky',
  defaultUISize = 'md',
}) => {
  const value = {
    defaultTheme,
    defaultAccent,
    defaultUISize,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Custom hook for easier consumption
export const useTheme = () => useContext(ThemeContext)
