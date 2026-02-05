import { createContext, useContext } from 'react'

interface ThemeContextType {
  dark: boolean
  toggle: () => void
  setTheme: (theme: 'light' | 'dark' | null) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
