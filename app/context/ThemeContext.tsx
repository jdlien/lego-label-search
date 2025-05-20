'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import type { ThemeColor, AccentColor } from '../types/theme'

// Define the shape of our theme context
export interface ThemeContextType {
  defaultTheme: ThemeColor
  defaultAccent: AccentColor
}

// Create the context with default values
export const ThemeContext = createContext<ThemeContextType>({
  defaultTheme: 'gray',
  defaultAccent: 'sky',
})

// Provider component
interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeColor
  defaultAccent?: AccentColor
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'gray',
  defaultAccent = 'sky',
}) => {
  const value = {
    defaultTheme,
    defaultAccent,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Custom hook for easier consumption
export const useTheme = () => useContext(ThemeContext)
