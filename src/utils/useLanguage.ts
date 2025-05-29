import { useState, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import useCookieStorage from './useCookieStorage'

export const useLanguage = () => {
  const { i18n } = useTranslation()
  const [currentLocale, setCurrentLocale] = useCookieStorage('locale', 'en')
  const [isChanging, setIsChanging] = useState(false)

  // Sync with i18n if needed (only when locale is different)
  useEffect(() => {
    if (currentLocale !== i18n.language) {
      const loadAndChangeLanguage = async () => {
        try {
          // Load translations if not already loaded
          if (!i18n.hasResourceBundle(currentLocale, 'common')) {
            const response = await fetch(`/locales/${currentLocale}/common.json`)
            if (response.ok) {
              const translations = await response.json()
              i18n.addResourceBundle(currentLocale, 'common', translations, true, true)
            }
          }
          
          // Change language
          await i18n.changeLanguage(currentLocale)
        } catch (error) {
          console.error('Error loading language:', error)
        }
      }
      
      loadAndChangeLanguage()
    }
  }, [currentLocale, i18n])

  const changeLanguage = async (locale: string) => {
    if (currentLocale === locale || isChanging) return
    
    try {
      setIsChanging(true)
      
      // Save to cookie
      setCurrentLocale(locale)
      
      // Load translations if not already loaded
      if (!i18n.hasResourceBundle(locale, 'common')) {
        const response = await fetch(`/locales/${locale}/common.json`)
        if (response.ok) {
          const translations = await response.json()
          i18n.addResourceBundle(locale, 'common', translations, true, true)
        }
      }
      
      // Change language
      await i18n.changeLanguage(locale)
      
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setIsChanging(false)
    }
  }

  return {
    currentLocale,
    changeLanguage,
    isChanging
  }
} 