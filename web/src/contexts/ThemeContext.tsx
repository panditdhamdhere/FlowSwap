import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      console.log('Initial theme from localStorage:', savedTheme)
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme
      }
      
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      console.log('System prefers dark:', systemPrefersDark)
      return systemPrefersDark ? 'dark' : 'light'
    }
    console.log('Window not available, defaulting to light')
    return 'light'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      console.log('Applying theme to DOM:', theme)
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
      localStorage.setItem('theme', theme)
      console.log('Theme applied, root classes:', root.classList.toString())
    }
  }, [theme])

  const toggleTheme = () => {
    console.log('toggleTheme called, current theme:', theme)
    setThemeState(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      console.log('Setting theme from', prev, 'to', newTheme)
      return newTheme
    })
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
