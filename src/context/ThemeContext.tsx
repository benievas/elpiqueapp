import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { THEMES, DEFAULT_THEME, ThemeKey, ThemeColors } from '../lib/themes'

type ThemeContextType = {
  themeKey: ThemeKey
  colors: ThemeColors
  setTheme: (key: ThemeKey) => void
  themeLoaded: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  themeKey:    DEFAULT_THEME,
  colors:      THEMES[DEFAULT_THEME].colors,
  setTheme:    () => {},
  themeLoaded: false,
})

const STORAGE_KEY = 'elpique_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey]     = useState<ThemeKey>(DEFAULT_THEME)
  const [themeLoaded, setThemeLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && stored in THEMES) setThemeKey(stored as ThemeKey)
    }
    setThemeLoaded(true)
  }, [])

  function setTheme(key: ThemeKey) {
    setThemeKey(key)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, key)
    }
  }

  return (
    <ThemeContext.Provider value={{ themeKey, colors: THEMES[themeKey].colors, setTheme, themeLoaded }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
