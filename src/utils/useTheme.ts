import { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'

type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const [cookies, setCookie] = useCookies(['theme'])
  const [currentTheme, setCurrentTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    // Get theme from cookie or default to 'system'
    const savedTheme = (cookies.theme as Theme) || 'system'
    setCurrentTheme(savedTheme)
    
    const applyTheme = (theme: Theme) => {
      const html = document.documentElement
      
      if (theme === 'system') {
        // Use system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(systemDark ? 'dark' : 'light')
        if (systemDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      } else {
        setResolvedTheme(theme)
        if (theme === 'dark') {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      }
    }

    applyTheme(savedTheme)

    // Listen for system theme changes if theme is set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (savedTheme === 'system') {
        applyTheme('system')
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [cookies.theme])

  const changeTheme = async (newTheme: Theme) => {
    setIsChanging(true)
    
    try {
      // Save to cookie
      setCookie('theme', newTheme, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax'
      })
      
      setCurrentTheme(newTheme)
      
      // Apply theme immediately
      const html = document.documentElement
      
      if (newTheme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(systemDark ? 'dark' : 'light')
        if (systemDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      } else {
        setResolvedTheme(newTheme)
        if (newTheme === 'dark') {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      }
    } catch (error) {
      console.error('Failed to change theme:', error)
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setIsChanging(false), 200)
    }
  }

  return {
    currentTheme,
    resolvedTheme,
    changeTheme,
    isChanging
  }
} 