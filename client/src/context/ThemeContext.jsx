/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    const stored = localStorage.getItem('dnb-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch (e) {
    // ignore
  }
  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    // ensure html element has the proper dark class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      try {
        localStorage.setItem('dnb-theme', 'dark')
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark')
      try {
        localStorage.setItem('dnb-theme', 'light')
      } catch (e) {}
    }
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme() {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
      },
      setTheme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
}
