import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  actualTheme: 'dark' | 'light' // The actual applied theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, default to system
    const stored = localStorage.getItem('genone-theme') as Theme
    return stored || 'system'
  })

  // Calculate the actual theme based on system preference when theme is 'system'
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const actualTheme = theme === 'system' ? systemTheme : theme

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    console.log('Theme effect triggered, setting theme to:', actualTheme)
    localStorage.setItem('genone-theme', theme)
    
    // Update document class for Tailwind dark mode
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark')
      console.log('Added dark class to document')
    } else {
      document.documentElement.classList.remove('dark')
      console.log('Removed dark class from document')
    }
  }, [theme, actualTheme])

  const toggleTheme = () => {
    console.log('toggleTheme called, current theme:', theme)
    const themeOrder: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themeOrder.indexOf(theme)
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
    console.log('Setting new theme to:', nextTheme)
    setTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 