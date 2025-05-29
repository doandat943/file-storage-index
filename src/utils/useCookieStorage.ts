import { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'

/**
 * Hook similar to useLocalStorage but using cookies instead of localStorage
 * To be compatible with SSR and avoid hydration mismatch
 */
const useCookieStorage = <T>(key: string, defaultValue: T): [T, (value: T) => void] => {
  const [cookies, setCookie] = useCookies([key])
  const [isClient, setIsClient] = useState(false)
  
  // Only use cookie value when client has mounted
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Server-side always returns defaultValue, client-side returns cookie value
  const value = isClient ? (cookies[key] ?? defaultValue) : defaultValue
  
  // Function to set cookie
  const setValue = (newValue: T) => {
    setCookie(key, newValue, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'strict'
    })
  }
  
  return [value, setValue]
}

export default useCookieStorage 